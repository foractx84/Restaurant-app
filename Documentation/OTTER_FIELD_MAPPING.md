# Otter → TapTab Menu Field Mapping (TAB-427)

## Purpose

A field-by-field reference mapping Otter's menu data model to TapTab's, so TAB-428 (the parser/sync
engine) has a single source of truth to implement against, and so gaps in either direction are
visible for a product decision before they're silently dropped in code.

No surviving field-level reference from Checkmate's TAB-194 exists in this repo to model this on
directly — the closest artifact (`CHECKMATE-FLOW-EXPLANATION.md`, an architecture/flow walkthrough)
predates the current diff-based sync pipeline and has since been removed. This document instead
follows the same purpose TAB-194 served for the Checkmate integration, formalized as the field-level
tables this ticket's acceptance criteria ask for.

## Sources

- **Otter**: `src/interfaces/otter.interface.ts` (fields the current normalizer models) plus the
  broader Otter OpenAPI spec surface already researched for TAB-425
  (`Documentation/OTTER_MODIFIER_GAP_ANALYSIS.md`) — `Menu`, `Category`, `MenuItem_POS`/
  `MenuItem_3PD`, `ModifierGroup`, `Money`, `Hours`.
- **TapTab (intermediate)**: `NormalizedMenu` and friends, `src/interfaces/platformIntegration.interface.ts`
  — the platform-agnostic shape both Checkmate's and Otter's normalizers build, and the only shape
  the diff/sync pipeline (`MenuSyncProcessor`) understands.
- **TapTab (storage)**: TypeORM entities under `src/entities/*.ts` — the actual Postgres columns
  a normalized menu ultimately lands in.

## Legend

| Marker | Meaning |
|---|---|
| ✅ | Implemented today — `normalizeOtterMenus` (TAB-428) reads this field and it reaches the DB |
| ⏳ | Schema/type exists but not wired into the normalizer or persisted for Otter (fast-follow) |
| ❌ | No equivalent on the other side — flagged below for a product decision |

---

## 1. Menu level

| Otter field (`MenuPOS`) | Type | `NormalizedMenu` | TapTab DB (`menus`) | Status |
|---|---|---|---|---|
| `id` | string | `.id` | `external_id` | ✅ |
| `name` | string | `.name` | `name` | ✅ |
| `description` | string? | `.description` | *(no column)* | ❌ — see §7. `menus` has no `description` column at all; the value is carried in `NormalizedMenu` but has nowhere to land once a command executes. Same gap exists for Checkmate today. |
| `categoryIds[]` | string[] | `.sections[]` (structural) | `menu_sections.menu_id` FK | ✅ (traversed, not a field itself) |
| `hours.intervals[]` | `HourInterval[]` | `.hours.<Day>[]` | `menu_hours` (`day`/`start`/`end`) | ✅ — `otterHoursToNormalized` buckets by day, formats `HH:MM` |
| — | — | — | `restaurant_id`, `list_order`, `is_prix_fixe`, `is_hidden`, `deleted` | ❌ — see §8, TapTab-only fields |

## 2. Section level (Otter `Category`)

| Otter field (`Category`) | Type | `NormalizedMenuSection` | TapTab DB (`menu_sections`) | Status |
|---|---|---|---|---|
| `id` | string | `.id` | `external_id` | ✅ |
| `name` | string | `.name` | `name` | ✅ |
| `description` | string? | `.description` | *(no column — see `message` below)* | ❌ — see §7, same gap as menu-level `description` |
| `itemIds[]` | string[] | `.items[]` (structural) | `menu_items.menu_section_id` FK | ✅ (traversed) |
| — | — | — | `message` (text) | ❌ — see §8. TapTab-specific note field (e.g. "served after 4pm"); not populated by either normalizer today |
| — | — | — | `list_order`, `is_hidden`, `deleted` | ❌ — see §8 |

## 3. Item level

| Otter field (`MenuItem_POS`) | Type | `NormalizedMenuItem` | TapTab DB | Status |
|---|---|---|---|---|
| `id` | string | `.id` | `menu_items.external_id` | ✅ |
| `name` | string | `.name` | `menu_items.name` | ✅ |
| `description` | string? | `.description` | `menu_items.description` | ✅ — item level *does* have a real description column, unlike menu/section |
| `price.amount` (decimal dollars) | `Money` | `.price` (integer cents, via `otterPriceToCents`) | *(see below — not a direct column)* | ✅ conversion, ⏳ persistence path |
| `modifierGroupIds[]` | string[] | `.modifierGroups[]` (structural) | `modifier_group_to_menu_item_link` | ✅ (traversed) |
| `status.saleStatus` (`FOR_SALE`/`INDEFINITELY_NOT_FOR_SALE`/`TEMPORARILY_NOT_FOR_SALE`) | enum | `.isHidden` (via `otterItemIsHidden`) | `menu_items.is_hidden` | ✅ — see §7 (resolved) |
| `status.suspendedUntil` | timestamp? | *(not modeled)* | *(no column)* | ❌ — intentionally not modeled, see §7 |
| — (Otter item photos not modeled in our current type subset) | — | — | `image_url` | ❌ — see §8 |
| — | — | — | `calories`, `is_featured`, `category` (free text), `base_item_size_id` | ❌ — see §8 |

**Price persistence path is structural, not a column mapping.** `menu_items` has no `price` column.
TapTab prices an item through a mandatory `base_item_size_id` FK to `menu_items_sizes` →
`menu_items_sizes_types.price`, i.e. every item requires at least one "size" row (even
single-size items get one implicit size) and the *size* carries the price, not the item. Otter has
no multi-size concept — one flat `Money` per item id. `normalizeOtterMenus`'s `otterPriceToCents`
only does the currency conversion; turning that into a persisted price still means synthesizing an
implicit size-type row per item, the same adapter step Checkmate's parser already has to do. Worth
confirming this is handled correctly in TAB-428 for the Otter path specifically, since it's easy to
get the FK direction backwards for a "sizeless" source menu.

## 4. Modifier group level (Otter `ModifierGroup`)

Covered in depth in `Documentation/OTTER_MODIFIER_GAP_ANALYSIS.md` (TAB-425) — summarized here for
completeness per this ticket's AC.

| Otter field | Type | `NormalizedModifierGroup` | TapTab DB (`modifier_groups`) | Status |
|---|---|---|---|---|
| `id` | string | `.id` | `external_id` | ✅ |
| `name` | string | `.name` | `name` (and `label`, duplicated — see §8) | ✅ |
| `itemIds[]` | string[] | `.modifiers[]` (structural) | `modifier_to_modifier_group_link` / `modifier_group_to_modifier_link` (nested) | ✅ traversal, ⏳ persistence (schema exists, TAB-428 doesn't populate it — nesting deferred) |
| `minimumSelections` | integer | *(not modeled — no field on `NormalizedModifierGroup`)* | `minimum_selections` | ⏳ — column exists (TAB-425), not wired into the normalizer or diff pipeline yet |
| `maximumSelections` | integer | *(not modeled)* | `maximum_selections` | ⏳ — same |
| `maxPerModifierSelectionQuantity` | integer | *(not modeled)* | `max_per_modifier_selection_quantity` | ⏳ — same |
| `defaultModifierSelectionData` | object | *(not modeled)* | *(no column)* | ❌ — see §7, not modeled anywhere yet |
| `type` (`DEFAULT`/`UPSELL`/`INGREDIENT_REMOVAL`/etc.) | enum | *(not modeled)* | *(no column)* | ❌ — see §7 |
| `description` | string? | *(not modeled)* | *(no column)* | ❌ — see §7 |

## 5. Modifier level (Otter: an item playing the modifier role)

| Otter field (`MenuItem_POS` referenced from `itemIds`) | Type | `NormalizedModifier` | TapTab DB (`modifiers`) | Status |
|---|---|---|---|---|
| `id` | string | `.id` | `external_id` | ✅ |
| `name` | string | `.name` | `name` | ✅ |
| `description` | string? | `.description` | `description` | ✅ |
| `price.amount` | `Money` | `.price` (cents) | `price` (flat `int4`) | ✅ — unlike items, modifiers *do* have a direct `price` column, no size-type detour |
| `priceOverrides[]` (per-channel/fulfillment-mode) | array | *(not modeled)* | `modifier_price_overrides` table | ⏳ — table exists (TAB-425), not populated for Otter yet |
| `modifierGroupIds[]` (nesting — a modifier can itself own modifier groups) | string[] | *(not modeled)* | `modifier_group_to_modifier_link` | ⏳ — table exists (TAB-425), normalizer deliberately doesn't recurse (v1 scope, per `Documentation/OTTER_MENU_SYNC.md`) |
| `status` | `ItemStatus` | `.isHidden` (via `otterItemIsHidden`) | `modifiers.is_hidden` | ✅ — same resolution as item-level status, see §7 |
| `exposedThirdPartyInfos[]` (multiple external ids, one per platform) | array | — | single `external_id text` column, no party discriminator | ❌ — pre-existing gap, documented in TAB-425's gap analysis, not fixed there or here |

---

## 6. Non-Otter Checkmate-only comparison note

For context: `normalizeCheckmateMenus` has the **identical** gaps at the modifier-group level (drops
`minimum_amount`/`maximum_amount`/nested groups from Checkmate's own payload today) — this isn't an
Otter-specific shortfall, it's a pre-existing gap in the shared pipeline that happens to also apply
to Otter. See `OTTER_MODIFIER_GAP_ANALYSIS.md` for the full writeup.

## 7. Otter fields with no TapTab equivalent (flag for product decision)

| Field | Where | Why it might matter |
|---|---|---|
| `menus.description`, `categories.description` | Menu, Section | Otter sends these; TapTab has no column to store either. Silently dropped today (also true for Checkmate). **Decision needed**: add columns, or accept the loss? |
| `MenuItem.status` (`saleStatus`/`suspendedUntil`) | Item, Modifier | **Resolved.** Otter is the source of truth for availability: both `INDEFINITELY_NOT_FOR_SALE` and `TEMPORARILY_NOT_FOR_SALE` map to `is_hidden: true` on pull sync (`otterItemIsHidden` in `normalize.ts`), and every pull sync overwrites whatever hide state a manager set manually in TapManager for the same item/modifier — a manager 86ing from the POS is expected to be faster/more common than logging into TapManager. `suspendedUntil` is still not modeled: TapTab's `is_hidden` has no "until when" concept, so a `TEMPORARILY_NOT_FOR_SALE` item just stays hidden until Otter reports `FOR_SALE` again (its own auto-resume or a manual un-86), which the next sync (webhook or the hourly `OTTER_MENU_SYNC_SCAN` fallback) picks up — no need to track the resume timestamp ourselves. |
| `ModifierGroup.type` | Modifier group | Otter categorizes groups (`UPSELL`, `INGREDIENT_REMOVAL`, `SIZE_MODIFICATION`, etc.). No TapTab concept of modifier-group type — everything is just "a modifier group." Informational only in Otter's spec, but could drive UI/UX decisions later. |
| `ModifierGroup.defaultModifierSelectionData` | Modifier group | Pre-selected default modifiers for a group. No TapTab equivalent — every modifier is opt-in today. |
| `MenuItem.exposedThirdPartyInfos[]` | Item, Modifier | Otter models *multiple* external ids per entity (one per platform); TapTab has one bare `external_id` column with no party discriminator (flagged pre-existing in TAB-425's gap analysis — a real collision risk if Checkmate and Otter are ever both active for the same restaurant). |
| Item-level `priceOverrides[]` | Item | TAB-425 added `modifier_price_overrides` for **modifiers**, but menu **items** have no equivalent override table — only modifiers get channel/fulfillment-mode pricing today. Is that an intentional scope decision, or should items get the same treatment? |

## 8. TapTab fields with no Otter equivalent (flag for product decision)

| Field | Where | Notes |
|---|---|---|
| `menu_items.calories` | Item | No nutritional data in the Otter fields modeled so far. Left `null`/unset on Otter-sourced items. |
| `menu_items.is_featured` | Item | TapTab-specific merchandising flag. No signal from Otter to set this automatically — stays manager-controlled. |
| `menu_items.image_url` / item media | Item | Our current `OtterMenuItemPOS` type doesn't model an image field — worth double-checking the real API response for one before assuming there's truly nothing to map. |
| `menu_items.category` (free-text) | Item | Distinct from `menu_sections` — a secondary free-text categorization on the item itself. No Otter source identified. |
| `menu_items.base_item_size_id` / the size-type model generally | Item | Structural mismatch, not just a missing field — see §3. Otter has no sizes; TapTab requires every item to resolve to a size-type row for pricing. |
| `menu_sections.message` | Section | TapTab-specific note field (e.g. hours caveat, upsell blurb). No Otter source. |
| `modifier_groups.label` vs `.name` | Modifier group | TapTab stores both `label` and `name` (historically `label` was the original field, `name` added later — see entity comments). Otter only has one `name`. Current normalizer sets both from Otter's single `name`; worth confirming that's the intended behavior long-term rather than a placeholder. |
| Menu-level `disclaimers` (`MenuDisclaimerEntity`) | Menu | TapTab supports per-menu disclaimers (e.g. allergen notices). No Otter field identified as a source — likely stays TapTab/manager-authored regardless of POS integration. |
| `menus.is_prix_fixe` | Menu | TapTab-specific menu type flag. No Otter equivalent. |

---

## Implementation status cross-reference

| Ticket | What it covers | Status |
|---|---|---|
| TAB-422 | `external_id`/`external_party` columns for Otter menu entities | ✅ Done (patch-v0-102) — **note**: DB columns exist for `menus`/`menu_sections`/`menu_items`/`modifier_groups`/`modifiers`, but the TypeORM **entity classes** for those five only expose `external_id`, not `external_party` (only `modifier_price_overrides`, `restaurant_platform_integrations`, and `restaurant_menu_snapshots` entities have `external_party` mapped). If a future ticket needs to disambiguate Checkmate vs. Otter rows at the entity layer for these five tables, the column is there but the app-level plumbing to read/write it isn't yet. |
| TAB-425 | Modifier-group min/max, nested-modifier tables, price-override table | ✅ Schema done, ⏳ not yet consumed by the normalizer (deferred to a fast-follow per TAB-428's documented v1 scope) |
| TAB-428 | `normalizeOtterMenus` — menu/section/item/modifier-group/modifier walk, price-cents conversion, hours bucketing | ✅ Done for the ✅ rows above; the ⏳/❌ rows are the fast-follow scope |
