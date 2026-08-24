# Checkmate Menu Sync — Developer Documentation

## Overview

This document describes the end-to-end flow of the Checkmate menu sync system, from the initial webhook event through job queuing, menu diffing, and database persistence. The system is designed to keep a restaurant's internal menu state in sync with the source-of-truth data from Checkmate's API, without performing redundant writes when nothing has changed.

---

## 1. Webhook Entry Point — `POST /checkmate/webhook`

Checkmate sends a webhook event to `/checkmate/webhook` when a menu change occurs. The payload includes a `location_id` that maps to a restaurant in our system.

### Handler: `handleCheckmateEvent`

```typescript
handleCheckmateEvent = async (event: CheckmateEvent) => { ... }
```

**Flow:**

1. Extract `location_id` from the event payload.
2. Query the `PlatformIntegration` table for a row matching `location_id` and platform `'checkmate'`. This record holds:
  - `restaurantID` — our internal restaurant identifier
  - Auth credentials (access token, refresh token, metadata)
3. If no integration is found, throw a `404` — the webhook is for a restaurant we don't know about.
4. If found, enqueue a pg-boss job on the `CHECKMATE_MENU_SYNC` queue.

```typescript
await this.boss.send(QUEUES.CHECKMATE_MENU_SYNC, checkmateJob, {
  singletonKey: `location-${location_id}`,
  singletonNextSlot: true,
});
```

---

## 2. Job Queue — pg-boss

### Setup in `server.ts`

pg-boss is initialized as a singleton and started before the HTTP server begins accepting traffic. The general pattern looks like:

```typescript
// server.ts
const boss = new PgBoss(connectionString);
await boss.start();

boss.work(QUEUES.CHECKMATE_MENU_SYNC, { batchSize: 1 }, processCheckmateJob);
```

The `boss` instance is injected (or imported as a singleton) wherever jobs need to be sent or consumed. Keeping it as a singleton ensures a single connection pool and worker registration across the application.

### Singleton Key Behavior

The job is enqueued with two options:

```typescript
{
  singletonKey: `location-${location_id}`,
  singletonNextSlot: true,
}
```

- **`singletonKey`**: Ensures only one job with this key can be *pending* in the queue at a time. If a job for `location-123` is already pending, a new one won't be inserted.
- **`singletonNextSlot`**: Modifies the above — instead of dropping the duplicate, pg-boss schedules it for the *next available slot*. This means: if a job is currently running and another event arrives, it will be queued to run immediately after the current one finishes, rather than being silently dropped.

**The combined effect:** At any given time there is at most one running job and one pending job per `location_id`. Additional events that arrive while both slots are filled are dropped.

### ⚠️ Race Condition — Known Gap

The current singleton key setup does not protect against a scenario where two webhook events arrive in rapid succession before the first job has been picked up by a worker. In that window, both `send()` calls may succeed because pg-boss's singleton check is not atomic with job insertion under all conditions.

**Recommended solutions (pick one based on acceptable complexity):**

- **Advisory lock in the worker** — Acquire a PostgreSQL advisory lock at the start of `processCheckmateJob` keyed on `location_id`. If the lock can't be acquired, exit early. The next job will re-run the sync.
- **Database-level deduplication** — Add a unique constraint on `(singletonKey, state)` in the pg-boss jobs table for pending jobs (pg-boss does this internally in newer versions — verify your version's behavior).
- **Optimistic locking on the snapshot** — At the point of writing the new snapshot (step 4), compare against the snapshot version that was read at the start of the job. If it has changed, abort. This prevents a stale write but doesn't prevent redundant API calls.

The advisory lock approach is the lowest-risk change that covers the gap without touching pg-boss internals.

---

## 3. Job Processor — `processCheckmateJob`

```typescript
processCheckmateJob = async (jobs: Job<CheckmateJob>[]): Promise<void> => { ... }
```

The worker receives a batch (configured to `batchSize: 1`) and processes `jobs[0]`.

### Steps

**a. Fetch menu from Checkmate API**

A `TokenStore` is instantiated for the location. It handles token refresh transparently via the Axios interceptor layer. A `CheckmateClient` is created from it and used to fetch the current menu JSON from Checkmate's API.

**b. Normalize and hash**

The raw Checkmate menu JSON is normalized into a canonical `NormalizedMenu[]` format — stripping any fields that are irrelevant to sync (e.g., timestamps, internal Checkmate metadata). The normalized structure is stringified deterministically and hashed with SHA-256.

**c. Snapshot comparison**

The latest stored snapshot for the restaurant is retrieved. Three outcomes are possible:

| Condition | Action |
|-----------|--------|
| No snapshot exists | Full initial sync — create all menu entities from scratch |
| Hash matches latest snapshot | No-op — menus are identical, exit early |
| Hash differs | Diff-based update — compute changes and apply them |

All writes in step (d) happen inside a single database transaction.

---

## 4. Three Paths

### Path A — No Snapshot (Initial Sync)

```typescript
await this.menuDetailsService.createMenusDetailsFromNormalized(
  normalizedMenus, restaurantID, locationID, manager
);
```

The entire menu hierarchy is created recursively in the following order:

```
Menu
  └── Section
        └── Item
              └── ModifierGroup
                    └── Modifier
```

Each level is inserted before its children. Foreign keys flow downward. This is a full write — no diffing occurs.

### Path B — Hash Match (No-op)

The function returns early. No database writes or snapshot updates occur. This is the hot path for noisy Checkmate webhooks that fire without an actual menu change.

### Path C — Hash Differs (Diff-based Update)

```typescript
await this.processor.process(
  latestSnapshot.menuJson, normalizedMenus, restaurantID, locationID, manager
);
```

See section 5 for details on the diff processor.

---

After any path that writes data (A or C), a new snapshot is created:

```typescript
await this.restaurantMenuSnapshotService.createMenuSnapshot(
  restaurantID, normalizedMenus, menuHash, 'checkmate', manager
);
```

This stores the normalized menu JSON and its hash for the next comparison.

---

## 5. Diff Processor — `processor.process`

### What is `json-diff-ts`?

`json-diff-ts` (`diff()` function) compares two JSON objects and returns a structured change set describing what was added, removed, or updated. Crucially, it supports *keyed arrays* — rather than diffing arrays by index (which produces spurious changes when items are reordered), it diffs by a specified key field. This makes it suitable for menu structures where items can be reordered without representing a real change.

### Configuration

```typescript
const changes = diff(oldData, newData, {
  embeddedObjKeys: {
    '.': 'id',
    '.sections': 'id',
    '.sections.items': 'id',
    '.sections.items.modifierGroups': 'id',
    '.sections.items.modifierGroups.modifiers': 'id',
    '.hours.Monday': hourCompositeKey,
    '.hours.Tuesday': hourCompositeKey,
    // ... (all 7 days)
  },
});
```

Each key in `embeddedObjKeys` is a dot-path into the JSON structure. The value tells `json-diff-ts` which field to use as the stable identity for items in that array.

- **Menu entities** (menus, sections, items, modifier groups, modifiers) use `'id'` — their UUID or integer primary key is the stable identity.
- **Hours** use a composite key because hour records have no surrogate ID:

```typescript
const hourCompositeKey = (timespan: NormalizedMenuHour, shouldReturnKeyName: boolean): string =>
  shouldReturnKeyName ? 'compositeKey' : `${timespan.startTime}-${timespan.endTime}`;
```

The function signature matches the `json-diff-ts` callback interface. When `shouldReturnKeyName` is `true`, the library is asking for the *name* of the key property (returned as `'compositeKey'`). When `false`, it's asking for the *value* of the key for a specific object — computed as `startTime-endTime` (e.g., `"09:00-17:00"`). This allows the differ to track hour timespans by their time range rather than array position.

### What happens with the diff output

The change set produced by `diff()` is passed into a command factory that maps each change type (`ADD`, `UPDATE`, `REMOVE`) to a typed command object. Commands are then executed in order using TypeORM within the transaction passed down from `processCheckmateJob`.

The command pattern ensures:
- Operations are atomic within the transaction
- Execution order respects foreign key dependencies (e.g., a section must exist before its items are updated)
- `UPDATE` commands for the same entity are merged to avoid race conditions from concurrent writes to the same row

---

### `atomizeChangeset`

After `diff()` produces its changeset, it is passed to `atomizeChangeset` from `json-diff-ts`.

`diff()` returns a *nested* changeset that mirrors the structure of the JSON being compared — changes to a modifier are nested inside the item, inside the section, inside the menu. `atomizeChangeset` flattens this into an array of discrete, independent operations. Each element in the resulting array represents a single, minimal change:

- A field value updated on a specific entity
- An entity added to an array
- An entity removed from an array

Each operation carries a `path` (a JSONPath-style string identifying exactly where in the document the change occurred), a `type` (`ADD`, `UPDATE`, or `REMOVE`), a `key` (the field or entity ID), and the `value` / `oldValue`. This flat representation is what the rest of the pipeline operates on.

---

## Flow Diagram

```
Checkmate Webhook
      │
      ▼
POST /checkmate/webhook
      │
      ▼
Lookup PlatformIntegration by location_id
      │
      ├── Not found → 404
      │
      └── Found
            │
            ▼
      pg-boss.send(CHECKMATE_MENU_SYNC, { singletonKey: `location-${id}` })
            │
            ▼
      Worker picks up job
            │
            ▼
      Fetch menu via Checkmate API (with token refresh)
            │
            ▼
      Normalize → Stringify → Hash
            │
            ▼
      Load latest snapshot
            │
            ├── No snapshot → Full create (Path A)
            │
            ├── Hash matches → Exit (Path B)
            │
            └── Hash differs → Diff & apply commands (Path C)
                  │
                  ▼
            Save new snapshot
```

---

## Key Dependencies

| Dependency | Role |
|------------|------|
| `pg-boss` | Job queue backed by PostgreSQL |
| `json-diff-ts` | Structural diff of normalized menu JSON |
| `TypeORM` | ORM for all database operations |
| `TokenStore` | Handles Checkmate OAuth token refresh |
| `SHA-256` | Hashing normalized menu for change detection |
---

### Pipeline Overview — `process()`

The full transformation pipeline from raw diff to executed commands:

```
diff()  →  atomizeChangeset()  →  sortOperationsGenerator()  →  enrichOperation()
       →  mergeUpdateOperations()  →  operationsExpander()  →  commandFactory()
       →  orderCommands()  →  cmd.execute()
```

Each step is described below. Detailed breakdowns follow in subsequent sections.

---

## 6. Command Design Pattern

The menu sync system uses the **Command design pattern** to encapsulate each database operation as an object. Rather than executing database logic inline, every change (add a section, remove a modifier, update an item) becomes a `MenuCommand` instance with an `execute()` method.

This provides:
- **Separation of concerns** — the pipeline that builds commands is decoupled from the code that runs them.
- **Ordered execution** — commands can be sorted before any are run, ensuring foreign key constraints are never violated.
- **Testability** — individual commands can be unit tested in isolation.
- **Extensibility** — new entity types or operation types require only a new command class and an entry in the factory map.

Reference: https://refactoring.guru/design-patterns/command

### `MenuCommand` Interface

All commands implement a common interface:

```typescript
interface MenuCommand {
  execute(context: MenuUpdateContext, manager: EntityManager): Promise<void>;
}
```

`MenuUpdateContext` carries injected service dependencies (repositories, etc.) so commands don't need to construct their own. `EntityManager` is the active TypeORM transaction manager, passed down from `processCheckmateJob` to ensure all commands execute atomically within a single transaction.

Every concrete command (e.g., `AddItemCommand`, `RemoveSectionCommand`, `UpdateModifierCommand`) receives an `EnrichedOperation` in its constructor and uses it to drive the database call in `execute()`.

The full set of supported commands across all entity types:

| Entity | ADD | UPDATE | REMOVE | SORT |
|---|---|---|---|---|
| Menu | ✓ | ✓ | ✓ | ✓ |
| Section | ✓ | ✓ | ✓ | ✓ |
| Item | ✓ | ✓ | ✓ | ✓ |
| ModifierGroup | ✓ | ✓ | ✓ | ✓ |
| Modifier | ✓ | ✓ | ✓ | ✓ |
| Hours | ✓ | — | ✓ | — |

---

## 7. `sortOperationsGenerator`

```typescript
sortOperationsGenerator(oldMenus, newMenus, restaurantID, atomicOps): IAtomicSyncChange[]
```

`json-diff-ts` does not produce `SORT` operations — it is only aware of `ADD`, `UPDATE`, and `REMOVE`. However, the order of items within a menu's arrays is semantically meaningful (display order), and reordering without adding or removing items would be invisible to the diff.

`sortOperationsGenerator` extends the flat atomic ops array with `SORT` operations by independently comparing the ID sequences of each array level between the old and new data.

**Logic:**

The function walks the new menu tree recursively — menus → sections → items → modifier groups → modifiers. At each level it extracts the ordered array of IDs from both old and new data and compares them with `haveIDsChanged`:

```typescript
const haveIDsChanged = (oldIDs: string[], newIDs: string[]): boolean => {
  if (oldIDs.length !== newIDs.length) return true;
  return oldIDs.some((id, i) => id !== newIDs[i]);
};
```

If the ID sequences differ (same items, different order), a `SORT` operation is generated for that level.

**No-op conditions:** A sort operation is not generated if:
- The old array is empty — items are being added for the first time, not reordered.
- The new array is empty — items are being removed, not reordered.

This prevents `SORT` commands from firing when `ADD` or `REMOVE` commands are already handling the structural change.

The final return value is the original `atomicOps` array concatenated with any newly generated `SORT` operations.

---

## 8. `enrichOperation`

```typescript
enrichOperation(op: IAtomicSyncChange, menus: NormalizedMenu[], restaurantID, locationID): EnrichedOperation
```

The raw atomic operation from `json-diff-ts` carries a JSONPath-style `path` and a `type`, but nothing else about *what database entity* is being changed or *what context* (restaurant, menu, section, etc.) is required to execute it. `enrichOperation` parses the `path` to extract all of that.

Each operation is extended into an `EnrichedOperation` with three additional fields:

**`entity`** — resolved by `resolveEntity()`, which checks for specific path segments in order of specificity (deepest first):

```
modifiers[  →  'modifier'
modifierGroups[  →  'modifierGroup'
items[  →  'item'
sections[  →  'section'
hours  →  'hours'
(default)  →  'menu'
```

**`context`** — resolved by `resolveContext()`, which runs a set of regex matches against the path to extract every relevant ID:

```typescript
{
  locationId,
  restaurantId,
  menuId:          // $root[?(@.id=='...')]
  sectionId:       // sections[?(@.id=='...')]
  itemId:          // items[?(@.id=='...')]
  modifierGroupId: // modifierGroups[?(@.id=='...')]
  modifierId:      // modifiers[?(@.id=='...')]
  day:             // hours.<Day>
  index:           // [<number>]
}
```

**`id`** — the entity's own ID, extracted from `context` via `getIDForEntity()` using a switch on `entity`. This becomes the stable identity used downstream for merging.

---

## 9. `mergeUpdateOperations`

```typescript
mergeUpdateOperations(ops: EnrichedOperation[]): EnrichedOperation[]
```

`atomizeChangeset` produces one operation *per changed field*. If an item has three fields updated (e.g., `name`, `description`, `price`), the pipeline has three separate `UPDATE` operations for the same database row. Executing them individually means three separate `UPDATE` queries against the same row in rapid succession — wasteful and a potential source of race conditions within the transaction.

`mergeUpdateOperations` collapses multiple `UPDATE` operations targeting the same entity into a single operation whose `value` is the merged object of all field changes.

**Logic:**

- Non-`UPDATE` operations and `hours` `UPDATE` operations pass through unchanged. Hours are excluded from merging because their identity is a composite key rather than a surrogate ID, making deduplication more complex and less necessary.
- For each `UPDATE` operation, a merge key is generated: `"<entity>:<id>"` (e.g., `"item:abc-123"`).
- If a key has been seen before, the existing merged operation has its `value`, `oldValue`, and `keys` arrays extended.
- If the key is new, a fresh merged operation is created with `value` shaped as `{ [field]: newValue }`.

The result is a deduplicated array where each entity that changed appears at most once in the `UPDATE` group.

---

## 10. `operationsExpander`

```typescript
operationsExpander(ops: EnrichedOperation[]): EnrichedOperation[]
```

When a `REMOVE` operation targets a parent entity (e.g., a section), the database requires that all child records be removed first due to foreign key constraints. TypeORM's cascade soft delete behavior is not leveraged, which TypeORM does handle automatically but we implemented manually without realizing the option was there.

> **Future improvement:** Implement TypeORM cascade soft deletes on the entity relationships, `operationsExpander` can be removed entirely. This was built as an explicit workaround for the current lack of cascade soft-delete.

`operationsExpander` intercepts `REMOVE` operations (excluding `hours` and `modifier`, which have no children) and recursively expands them into a full set of `REMOVE` operations for every descendant.

**Expansion by entity:**

- **`menu` REMOVE** → generates `REMOVE` operations for each section, then recursively expands each section.
- **`section` REMOVE** → generates `REMOVE` operations for each item, then recursively expands each item.
- **`item` REMOVE** → generates `REMOVE` operations for each modifier group, then recursively expands each modifier group.
- **`modifierGroup` REMOVE** → generates `REMOVE` operations for each modifier.
- **`modifier` / `hours` REMOVE** → passed through as-is (no children).

Each expanded operation inherits the path, context, and entity type appropriate to the child being removed, with `context` patched to include the child's own ID. The parent's `REMOVE` operation is always appended *after* its children's — children are deleted first.

The final array contains the expanded child removes followed by the non-expanded operations.

---

## 11. `commandFactory`

```typescript
commandFactory(op: EnrichedOperation): MenuCommand
```

After the pipeline has produced its final, clean set of `EnrichedOperation` objects, `commandFactory` maps each one to a concrete `MenuCommand` instance using a static lookup table:

```typescript
const commandMap = {
  menu:          { ADD: AddMenuCommand,          REMOVE: RemoveMenuCommand,          SORT: SortMenusCommand,          UPDATE: UpdateMenuCommand },
  section:       { ADD: AddSectionCommand,       REMOVE: RemoveSectionCommand,       SORT: SortSectionsCommand,       UPDATE: UpdateSectionCommand },
  item:          { ADD: AddItemCommand,          REMOVE: RemoveItemCommand,          SORT: SortItemsCommand,          UPDATE: UpdateItemCommand },
  modifierGroup: { ADD: AddModifierGroupCommand, REMOVE: RemoveModifierGroupCommand, SORT: SortModifierGroupsCommand, UPDATE: UpdateModifierGroupCommand },
  modifier:      { ADD: AddModifierCommand,      REMOVE: RemoveModifierCommand,      SORT: SortModifiersCommand,      UPDATE: UpdateModifierCommand },
  hours:         { ADD: AddMenuHourCommand,      REMOVE: RemoveMenuHourCommand },
};
```

The lookup is `commandMap[op.entity][op.type]`. If no entry exists for the combination, an error is thrown — this catches any operation that slipped through with an unexpected entity/type pair before it silently no-ops.

The command is instantiated with the `EnrichedOperation` as its only constructor argument, giving it everything it needs to execute the database write.

---

## 12. `orderCommands`

```typescript
orderCommands(commands: MenuCommand[]): MenuCommand[]
```

Commands must execute in a specific order to satisfy database constraints and produce correct results. `orderCommands` sorts the command array by a static priority map keyed on the command's class name:

```
Priority  Command
────────  ──────────────────────
1–7       REMOVE (deepest first: Modifier → ModifierGroup → Item → Section → Menu)
8–13      ADD (shallowest first: Menu → Section → Item → ModifierGroup → Modifier)
15–16     ADD/UPDATE Hours, UPDATE Menu
17–21     UPDATE (Section → Item → ModifierGroup → Modifier)
22–26     SORT (Menu → Section → Item → ModifierGroup → Modifier)
```

The ordering enforces:
- **REMOVEs before ADDs** — avoids constraint violations when an entity is being replaced.
- **Children removed before parents** — satisfies foreign key constraints on delete.
- **Parents added before children** — satisfies foreign key constraints on insert.
- **UPDATEs after structural changes** — ensures the row exists before it is updated.
- **SORTs last** — sort order is only meaningful after the final set of rows is in place.

Any command not in the priority map receives priority `99` and sorts to the end.
---

## 13. Menu Commands

### `MenuCommand` Interface

```typescript
export interface MenuCommand {
  execute(ctx: MenuUpdateContext, manager: EntityManager): Promise<void>;
}
```

Every command in the system implements this single-method interface. The two parameters give each command everything it needs:

- **`ctx: MenuUpdateContext`** — the injected service layer (repositories, service classes). Commands call into services rather than hitting the database directly, keeping database logic out of the command classes themselves.
- **`manager: EntityManager`** — the active TypeORM transaction manager passed down from `processCheckmateJob`. All commands share the same transaction, so either the entire sync succeeds or nothing is committed.

Commands are intentionally thin. Each one receives an `EnrichedOperation` in its constructor (which carries the entity type, context IDs, and the value to write) and delegates the actual database logic to the appropriate service.

### Command Structure

`AddMenuCommand` is representative of the pattern across all command classes:

```typescript
class AddMenuCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const locationID = this.op.context.locationId;
    const restaurantID = this.op.context.restaurantId;
    const menu: NormalizedMenu = this.op.value;

    await ctx.menuDetailsService.createMenusDetailsFromNormalized([menu], restaurantID, locationID, manager);
  }
}
```

The command unpacks the IDs and value it needs from `this.op.context` and `this.op.value`, then calls a service method, passing the transaction manager through. The service owns the actual SQL.

All other command classes follow this same shape — constructor takes `EnrichedOperation`, `execute` unpacks context and delegates to a service. The variation is only in which service method is called and what fields are read from the operation.

### Command Inventory

The full set of commands, grouped by operation type:

**ADD** — inserts a new entity (and its full child tree, in the case of `AddMenuCommand` which reuses `createMenusDetailsFromNormalized`):
`AddMenuCommand`, `AddSectionCommand`, `AddItemCommand`, `AddModifierGroupCommand`, `AddModifierCommand`, `AddMenuHourCommand`

**REMOVE** — soft-deletes a single entity. Because `operationsExpander` has already decomposed parent removes into individual child removes, each command only needs to act on the single entity it was given:
`RemoveMenuCommand`, `RemoveSectionCommand`, `RemoveItemCommand`, `RemoveModifierGroupCommand`, `RemoveModifierCommand`, `RemoveMenuHourCommand`

**UPDATE** — writes a partial update for the fields that changed. The `EnrichedOperation` at this point carries a merged `value` object (courtesy of `mergeUpdateOperations`) so the command issues a single `UPDATE` per entity regardless of how many fields changed:
`UpdateMenuCommand`, `UpdateSectionCommand`, `UpdateItemCommand`, `UpdateModifierGroupCommand`, `UpdateModifierCommand`

**SORT** — persists the new display order for an array of entities. The command receives the full ordered ID sequence from the `EnrichedOperation` and writes sort/position values to the database accordingly:
`SortMenusCommand`, `SortSectionsCommand`, `SortItemsCommand`, `SortModifierGroupsCommand`, `SortModifiersCommand`

Hours have no `UPDATE` or `SORT` commands — hour records are identified by their time range composite key, so a changed hour is always expressed as a `REMOVE` of the old record followed by an `ADD` of the new one.

---

## 14. Snapshot Storage

After all commands have executed successfully, a new menu snapshot is written within the same transaction:

```typescript
await this.restaurantMenuSnapshotService.createMenuSnapshot(
  restaurantID,
  normalizedMenus,
  menuHash,
  'checkmate',
  manager,
);
```

The snapshot stores:
- **`restaurantID`** — scopes the snapshot to the restaurant.
- **`normalizedMenus`** — the full normalized menu JSON that was just synced. This becomes the `oldData` in the next `diff()` call.
- **`menuHash`** — the SHA-256 hash of the stringified normalized menus. This is what `processCheckmateJob` checks first on every subsequent sync to determine whether a diff is even needed.
- **`'checkmate'`** — the platform source, allowing the snapshot table to support multiple POS integrations per restaurant in the future.

Because the snapshot write shares the transaction with all command executions, it is impossible for the snapshot to reflect a state that wasn't fully committed to the database. If any command fails and the transaction rolls back, the snapshot is also rolled back — the next sync will re-run against the previous snapshot and re-derive the same diff.

This is the terminal step of the sync. On success, `processCheckmateJob` logs completion and the pg-boss job is marked done.

---

## End-to-End Summary

```
Checkmate webhook arrives (location_id)
  └─ Lookup PlatformIntegration → get restaurantID + auth
  └─ Enqueue pg-boss job (singletonKey: location-<id>)

Worker picks up job
  └─ Fetch live menu from Checkmate API (TokenStore handles OAuth refresh)
  └─ Normalize → Stringify → SHA-256 hash

Load latest snapshot for restaurant
  ├─ No snapshot       → Full create (createMenusDetailsFromNormalized)
  ├─ Hash matches      → Exit, no writes
  └─ Hash differs      → Run diff pipeline:
       diff()
         → atomizeChangeset()        flatten nested changeset to atomic ops
         → sortOperationsGenerator() inject SORT ops for reordered arrays
         → enrichOperation()         parse path → entity, context IDs, own ID
         → mergeUpdateOperations()   collapse multi-field UPDATEs per entity
         → operationsExpander()      expand parent REMOVEs into child REMOVEs
         → commandFactory()          map each op to a MenuCommand instance
         → orderCommands()           sort by execution priority
         → cmd.execute() × N         run all commands in a single transaction

Write new snapshot (normalizedMenus + hash) — same transaction
```
