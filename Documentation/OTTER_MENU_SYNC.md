# Otter Menu Sync — Developer Documentation

## Overview

This document describes how Otter menu sync (TAB-428) fits into the diff-based sync engine already documented in [`MENU_SYNC.md`](./MENU_SYNC.md). The diff/merge/expand/order/execute pipeline (`MenuSyncProcessor`) is **platform-agnostic** — it operates purely on the shared `NormalizedMenu[]` shape and required no changes for Otter. Everything below is Otter-specific: how a menu change is detected, how Otter's flat graph is normalized into `NormalizedMenu[]`, and the one concurrency gap that was closed as part of this work.

Read `MENU_SYNC.md` first for the pipeline internals (`diff()` → `atomizeChangeset()` → `sortOperationsGenerator()` → `enrichOperation()` → `mergeUpdateOperations()` → `operationsExpander()` → `commandFactory()` → `orderCommands()` → `cmd.execute()`). This document only covers what's different for Otter.

---

## 1. Three Trigger Paths, One Job

Otter menu sync can be triggered three ways, all of which enqueue the same pg-boss job:

- **Webhook** — `POST /otter/webhook` → `OtterIntegrationController.initWebhook` → `OtterIntegrationService.handleOtterWebhook`. Primary, near-real-time path.
- **Manual** — `POST /otter/menu-sync` (behind `authorizationMiddleware`) → `OtterIntegrationController.triggerMenuSync` → `OtterIntegrationService.triggerManualMenuSync`. On-demand, for a single restaurant.
- **Scheduled scan** — `QUEUES.OTTER_MENU_SYNC_SCAN`, a pg-boss cron schedule (`0 * * * *`, hourly, UTC) registered in `server.ts` via `boss.schedule(...)`. The worker, `OtterIntegrationService.processOtterMenuSyncScan`, enumerates every connected Otter store (`platformIntegrationService.getAllConnectedPlatformIntegrations('otter')`) and enqueues a sync for each. This is the actual fallback called out in the AC ("triggered both by webhook and on a schedule/manual basis as a fallback") — it self-heals a dropped or delayed webhook within the hour without requiring anyone to notice and manually resync. One store's lookup/enqueue failure is logged and skipped rather than aborting the rest of the scan.

All three converge on the same helper:

```typescript
private enqueueMenuSync = async (restaurantID: number, otterStoreId: string, eventId: string): Promise<void> => {
  const job: OtterMenuSyncJob = { eventId, restaurantID, otterStoreId };
  await this.boss.send(QUEUES.OTTER_MENU_SYNC, job, {
    singletonKey: `store-${otterStoreId}`,
    singletonNextSlot: true,
  });
};
```

### Event-type routing

`handleOtterWebhook` only routes **menu-update** events into the sync flow — everything else (order events, infra/meta events, the legacy `stores.upsert` account-pairing event) is acknowledged and ignored without enqueueing anything. Classification is a prefix check in `isOtterMenuUpdateEvent` (`src/utils/otterWebhookEvent.util.ts`): `eventType` starting with `menus.` is a menu-update event; everything else (`orders.*`, `callback.error.write`, `ping`, `stores.upsert`) is not.

Otter's real webhook event catalog isn't documented anywhere in this codebase beyond the OAuth scopes requested for the client-credentials app (`OTTER.SCOPES`): `menus.entity_suspension menus.get_current menus.publish menus.read menus.upsert_hours orders.create orders.update callback.error.write ping`. A prefix check (rather than an exhaustive allowlist of exact event names) keeps routing correct as Otter adds more `menus.*` event types without further code changes here.

A missing/non-string `eventType`, or any other malformed shape, is logged and ignored rather than thrown — a bad payload can't crash the request; `OtterIntegrationController.initWebhook` always responds 200 to Otter regardless (it also wraps the whole handler in try/catch for e.g. unparseable JSON).

Within menu-update events, any event carrying a `metadata.storeId` that maps to a connected `PlatformIntegration` row enqueues a sync; events with no `storeId`, or a `storeId` we don't recognize, are logged and acknowledged without enqueueing. This part stays deliberately permissive about *which* `menus.*` event fired — because the job itself no-ops cheaply on a hash match (see `MENU_SYNC.md` §4 Path B), there's little cost to reacting to every menu-update event type versus the risk of missing one that wasn't allow-listed.

### Manual trigger

`triggerManualMenuSync(restaurantID)` looks up the restaurant's Otter integration via `getPlatformIntegrationByRestaurantIDAndPlatform` (added for this ticket — the existing lookups were by `locationID` or `storeID`, not the reverse). Throws `404` if the restaurant has no connected Otter store.

### Scheduled scan

```typescript
// server.ts
await boss.createQueue(QUEUES.OTTER_MENU_SYNC_SCAN, { retryLimit: 3, retryBackoff: true });
await boss.schedule(QUEUES.OTTER_MENU_SYNC_SCAN, '0 * * * *', null, { tz: 'UTC' });
await boss.work(QUEUES.OTTER_MENU_SYNC_SCAN, { localConcurrency: 1 }, otterService.processOtterMenuSyncScan);
```

```typescript
// OtterIntegrationService
processOtterMenuSyncScan = async (): Promise<void> => {
  const integrations = await this.platformIntegrationService.getAllConnectedPlatformIntegrations(OTTER_PLATFORM);
  for (const integration of integrations) {
    if (!integration.restaurantID || !integration.otterLocationID) continue;
    await this.enqueueMenuSync(integration.restaurantID, integration.otterLocationID, uuidv4());
  }
};
```

`getAllConnectedPlatformIntegrations` (`PlatformIntegrationModel`/`Service`, added for this ticket) queries `restaurant_platform_integrations` for rows matching the given `external_party` with a non-null `restaurant_id` — this excludes the app-level Otter client-credentials token row (`restaurant_id: null`, used internally by `OtterAuthService`), leaving only actual connected stores.

Because `enqueueMenuSync` reuses the same `singletonKey: store-<otterStoreId>` dedup as the webhook and manual paths, the scan is safe to fire unconditionally every hour — if a sync for a store is already pending or running (e.g. one just enqueued by a webhook seconds earlier), pg-boss's singleton behavior absorbs the duplicate rather than double-processing.

---

## 2. Closing the pg-boss Dedup Race — Advisory Lock

`MENU_SYNC.md` §2 documents a known gap in Checkmate's singleton-key dedup: two events arriving in rapid succession can both pass pg-boss's singleton check before either job starts, since the check isn't atomic with insertion. That doc recommends an advisory lock as the lowest-risk fix. This ticket implements it — **for Otter only**; Checkmate's `TokenStore`-based lock and job processing are untouched.

`src/utils/advisoryLock.ts` is a small, standalone, string-keyed wrapper around `pg_try_advisory_lock` / `pg_advisory_unlock`, generalized from the numeric, Checkmate-specific lock already used internally by `TokenStore`:

```typescript
export const acquireAdvisoryLock = async (pool: Pool, key: string): Promise<{ acquired: boolean; release: () => Promise<void> }> => { ... }
```

`processOtterMenuSyncJob` acquires the lock keyed on the Otter store id before doing any work, and skips the run entirely if another sync for the same store is already in flight:

```typescript
const lock = await acquireAdvisoryLock(pool, `otter-menu-sync:${otterStoreId}`);
if (!lock.acquired) {
  logger.info(`Otter menu sync already in progress for store ${otterStoreId}; skipping this run.`);
  return;
}
try {
  // fetch → normalize → hash → compare → apply → snapshot
} finally {
  await lock.release();
}
```

The lock is released in a `finally` block, so a failed sync (thrown `HttpException`, a network error, whatever) still releases the lock for the next attempt.

---

## 3. `normalizeOtterMenus` — Otter's Flat Graph → `NormalizedMenu[]`

### Otter's shape vs. Checkmate's shape

Checkmate's menu API returns a nested tree — sections contain items, items contain modifier groups, and so on. Otter's `GET /v1/menus` (scope `menus.read`) returns a **flat graph**: `menus`, `categories`, `items`, and `modifierGroups` are separate maps keyed by id, and each level references its children by an array of ids. Per Otter's own API documentation, _"a modifier is just an item"_ — a modifier is an entry in the `items` map, referenced from a `ModifierGroup.itemIds` array exactly the same way a regular menu item is referenced from a `Category.itemIds` array.

`normalizeOtterMenus` (`src/utils/normalize.ts`) walks this graph to rebuild the nested tree the shared pipeline expects:

```
menu.categoryIds → category.itemIds → item.modifierGroupIds → group.itemIds (→ modifier "items")
```

Dangling references (an id that doesn't resolve to an entry in the corresponding map) are silently dropped via `.filter(Boolean)` rather than throwing — malformed or partial API responses degrade gracefully instead of failing the whole sync.

### Price conversion

TapTab stores all prices as integer cents; Otter's `Money.amount` is a decimal (e.g. `7.65` = $7.65):

```typescript
const otterPriceToCents = (money?: OtterMoney): number => Math.round((money?.amount ?? 0) * 100);
```

### Hours

Otter represents hours as a flat list of `{ day, fromHour, fromMinute, toHour, toMinute }` intervals rather than Checkmate's per-day arrays. `otterHoursToNormalized` buckets intervals by day and formats them into the shared `HH:MM` string shape:

```typescript
const otterHourIntervalToNormalized = (interval: OtterHourInterval): NormalizedMenuHour => ({
  startTime: `${pad2(interval.fromHour)}:${pad2(interval.fromMinute)}`,
  endTime: `${pad2(interval.toHour)}:${pad2(interval.toMinute)}`,
});
```

### v1 scope — deliberately deferred

The following exist in Otter's API and/or the TAB-425 schema extensions, but are **not** yet carried into `NormalizedModifier` / `NormalizedModifierGroup` or synced by this pipeline:

- **Nested modifiers** — a modifier "item" can itself have `modifierGroupIds`. `normalizeOtterMenus` does not recurse into this; a modifier's own modifier groups are ignored.
- **Min/max selection rules** — `OtterModifierGroupPOS.minimumSelections` / `maximumSelections` / `maxPerModifierSelectionQuantity`.
- **Price overrides** — per-location or per-context price overrides on a modifier.

These were explicitly scoped out of TAB-428 as a fast-follow, since none of them exist yet in the shared `NormalizedModifier`/`NormalizedModifierGroup` shape or the diff pipeline — adding them is a separate, larger change spanning the normalizer, the shared interfaces, and the modifier/modifier-group commands.

---

## 4. `locationID` — Why It's `number | null` Now

The shared pipeline (`MenuSyncProcessor.process`, `enrichOperation`/`resolveContext`, `menuDetailsService.createMenusDetailsFromNormalized`, `AddMenuCommand`, `SortMenusCommand`) previously hard-typed `locationID: number`. That parameter exists for one reason: Checkmate restaurants are identified/verified via a `restaurants.location_id` column, so a Checkmate-sourced sync passes a real location id and the relevant service methods do an extra `findRestaurantEntityByIDAndLocationID` check.

Otter restaurants never populate that column — they're identified via `platform_integrations.otter_location_id` instead. Passing a real Checkmate-style `locationID` for an Otter sync isn't just unnecessary, there isn't one to pass. The fix was an additive, backward-compatible widening to `locationID: number | null` across the pipeline, with call sites branching:

```typescript
const restaurant =
  locationID != null
    ? await restaurantService.findRestaurantEntityByIDAndLocationID(restaurantID, locationID, manager)
    : await restaurantService.findRestaurantEntityByID(restaurantID);
```

`OtterIntegrationService` always passes `null` for `locationID`. Checkmate call sites are unaffected — they continue to pass a real `locationID` and take the `findRestaurantEntityByIDAndLocationID` branch exactly as before.

---

## 5. End-to-End Summary

```
Otter webhook           POST /otter/menu-sync         Hourly cron (OTTER_MENU_SYNC_SCAN)
(metadata.storeId)      (authenticated)                 └─ getAllConnectedPlatformIntegrations('otter')
  └─ Lookup by storeId    └─ Lookup by restaurantID       └─ For each connected store → enqueue
  └─ No storeId /         └─ Not connected → 404
     unconnected
     → 200, no-op
  └─ Connected            └─ Connected
     → enqueue job           → enqueue job
                    │                    │                              │
                    └────────────────────┴────── QUEUES.OTTER_MENU_SYNC ┘
                                        (singletonKey: store-<otterStoreId>)

Worker (processOtterMenuSyncJob)
  └─ Acquire advisory lock keyed on otterStoreId — skip run if already held
  └─ Fetch live menu via createOtterClient + fetchOtterMenu (GET /v1/menus)
  └─ normalizeOtterMenus() → stringifyNormalizedMenus() → SHA-256 hash
  └─ Load latest snapshot for restaurant (external_party = 'otter')
       ├─ No snapshot   → createMenusDetailsFromNormalized(..., locationID: null, ...)
       ├─ Hash matches  → no-op
       └─ Hash differs  → MenuSyncProcessor.process(old, new, restaurantID, locationID: null, manager)
                            (identical pipeline to Checkmate — see MENU_SYNC.md §5–§13)
  └─ Write new snapshot (external_party = 'otter') — same transaction
  └─ Release advisory lock (finally block — runs on success or failure)
```

---

## Key Dependencies

| Dependency                                    | Role                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pg-boss`                                     | Job queue backed by PostgreSQL (`QUEUES.OTTER_MENU_SYNC`, `QUEUES.OTTER_MENU_SYNC_SCAN`) and its `boss.schedule()` cron support for the hourly fallback scan |
| `pg_try_advisory_lock` / `pg_advisory_unlock` | Serializes concurrent syncs for the same Otter store                                                                                                         |
| `json-diff-ts`                                | Structural diff of normalized menu JSON (shared with Checkmate)                                                                                              |
| `TypeORM`                                     | ORM for all database operations                                                                                                                              |
| `OtterAuthServiceInterface`                   | Client-credentials token acquisition/refresh for the Otter API client                                                                                        |
| `SHA-256`                                     | Hashing normalized menu for change detection                                                                                                                 |
