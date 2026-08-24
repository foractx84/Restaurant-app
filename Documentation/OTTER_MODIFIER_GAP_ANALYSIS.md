# Otter Modifier Schema Gap Analysis (TAB-425)

## Purpose

TAB-219 (Checkmate) built the `modifiers` / `modifier_groups` tables and their link tables. This
document verifies whether that schema fully covers Otter's modifier data model, and records what
was extended and why. Scope is the **storage schema** for modifier groups/options — actually
consuming Otter's menu JSON into these tables is the parser ticket, TAB-428.

Sources: internal schema read directly from `src/entities/*.ts` and
`../Database/patches/patch-v0-67.sql` / `patch-v0-91.sql` / `patch-v0-92.sql`. Otter schema read
directly from their published OpenAPI spec (`ModifierGroup`, `ModifierGroupUpdateRequest`,
`MenuItem_POS`, `MenuItem_3PD`, `Money`, `ItemPriceOverride`/`PriceOverride`,
`DefaultModifierSelectionData`).

## Current schema (built for Checkmate, TAB-219/TAB-234 era)

- `modifiers` — one row per selectable option. Columns: `modifier_id`, `name`, `description`,
  `price` (flat `int4`), `restaurant_id`, `external_id`, `is_hidden`, soft-delete timestamps.
- `modifier_groups` — one row per group/category. Columns: `modifier_group_id`, `label`, `name`,
  `restaurant_id`, `external_id`, `is_hidden`, soft-delete timestamps.
- `modifier_to_modifier_group_link` — modifier ↔ modifier_group, with `list_order`.
- `modifier_group_to_menu_item_link` — modifier_group ↔ **menu_item only**, with `list_order`.
  There is no equivalent link from a modifier_group to a *modifier* — this is the structural
  reason nesting isn't possible today.
- Both `modifiers` and `modifier_groups` carry a single `external_id text` column for POS
  matching — no discriminator for *which* external party the id belongs to.

Notably, this gap already exists for Checkmate today, independent of Otter: Checkmate's own
webhook payload carries `minimum_amount`, `maximum_amount`, `allow_modifier_multiple_quantity` on
its modifier groups, and nested `modifier_groups` under a modifier, but
`normalizeCheckmateMenus` (`src/utils/normalize.ts`) silently drops all of it — the fields are
never read, and nested groups are never recursed into.

## Otter's modifier data model

Otter's spec makes an important structural choice explicit in the `ModifierGroup` schema
description: **"Modifiers to items are items themselves and their relationship is defined by
ModifierGroup."** A "modifier" in Otter's model is not a distinct type — it's the same
`MenuItem_POS` / `MenuItem_3PD` object used for top-level menu items, referenced by id from a
`ModifierGroup.itemIds` array. Since every item (including one being used as a modifier) can
itself carry `modifierGroupIds`, nesting is not a special case in Otter's model — it falls out
naturally from the same item/group graph, to unlimited depth.

Relevant fields, straight from the spec:

**`ModifierGroup`** (`minimumSelections`, `maximumSelections`, `maxPerModifierSelectionQuantity`,
`defaultModifierSelectionData`, `itemIds`, `type`):
- `minimumSelections: integer` — "Minimum number of selections customers can make in this
  ModifierGroup. 0 means no min limit."
- `maximumSelections: integer` — same, for the max.
- `maxPerModifierSelectionQuantity: integer, default 1` — max times a *single* modifier item can
  be selected within the group (e.g. "up to 3 extra cheese"). This is a third dimension beyond
  simple min/max group selection that neither our schema nor Checkmate's payload has any concept
  of.
- `defaultModifierSelectionData.defaultModifierSelections[]` — `{itemId, selectionQuantity}` —
  pre-selected defaults for a group. No equivalent anywhere in our schema.
- `itemIds[]` — the modifiers (items) belonging to this group.
- `type` (informational) — `DEFAULT | UPSELL | INGREDIENT_REMOVAL | INGREDIENT_ADD |
  PREPARE_INSTRUCTIONS | SIZE_MODIFICATION | PACKAGING_INSTRUCTION | CONDIMENT`.

**`MenuItem_POS` / `MenuItem_3PD`** (used for both real items and modifier "items"):
- `price: Money` (`{currencyCode, amount}`), not a flat number.
- `priceOverrides: ItemPriceOverride[] / PriceOverride[]` — `{rules[], currencyCode, amount}`
  where a rule is one of `ServiceOverrideRule` (per ordering-platform slug, e.g. `ubereats`),
  `FulfillmentModeOverrideRule` (pickup vs. delivery vs. dine-in), or `EntityPathOverrideRule`.
  Because modifiers are items, **modifiers get this for free** — a modifier's price can vary by
  channel/fulfillment mode independent of its base price.
- `exposedThirdPartyInfos: {externalId, externalServiceSlug}[]` — Otter's own entities carry an
  *array* of external ids, one per third-party system, not a single column. This directly
  validates a gap our internal schema already had before Otter existed: `external_id` on
  `modifiers`/`modifier_groups` is a single bare column with no party discriminator, so if two
  integrations (Checkmate, Otter) ever produced colliding ids for the same restaurant's modifier,
  today's schema can't disambiguate.

## Gap summary

| Capability | Current schema | Checkmate payload | Otter payload | Verdict |
|---|---|---|---|---|
| Min/max selections per group | Not supported | Present, dropped by normalizer | Present (`minimumSelections`/`maximumSelections`) | **Gap — extend** |
| Max quantity per single modifier | Not supported | Not present | Present (`maxPerModifierSelectionQuantity`) | **Gap — extend** |
| Nested modifiers (group under a modifier) | Not supported — group can only link to `menu_item` | Present, dropped by normalizer | Native (modifier = item, items can have their own groups) | **Gap — extend** |
| Price overrides per modifier | Not supported — single flat `price` | Not present | Present (`priceOverrides`, rule-based) | **Gap — extend** |
| Default selections | Not supported | Not present | Present (`defaultModifierSelectionData`) | **Gap — noted, not extended this ticket** (no current consumer; smaller/optional field, revisit if TAB-428 needs it) |
| External id per POS party | Single `external_id` column, no party discriminator | Uses the single column today | Would collide with Checkmate's if both were ever active for the same restaurant | **Pre-existing gap, noted, not changed this ticket** (out of scope — would mean touching the existing `external_id` column on two tables already relied on by Checkmate in production; a follow-up ticket, not bundled here) |

## Schema changes implemented

All changes are **additive only** — new nullable columns and new tables. Nothing existing is
renamed, dropped, or made required, so Checkmate's current read/write paths
(`checkmateIntegration.service.ts`, `menuDetails.service.ts`, the `menu-sync/commands/modifier*`
command classes) are unaffected; they simply never populate the new columns/tables.

- `modifier_groups` gains three nullable columns: `minimum_selections`, `maximum_selections`,
  `max_per_modifier_selection_quantity` (`int4`, all nullable — `NULL` means "not specified",
  matching Otter's own "0/unset means no limit" semantics without forcing a default on existing
  rows).
- New table `modifier_group_to_modifier_link` (mirrors `modifier_group_to_menu_item_link` exactly,
  just FK'd to `modifiers` instead of `menu_item`): lets a modifier group be linked either to a
  menu item (existing, top-level) or to a *parent modifier* (new, nested). Depth is not capped by
  the schema — a modifier group can link to a modifier, whose own modifier groups (via more rows
  in this same table) can link to further modifiers, matching Otter's graph model.
- New table `modifier_price_overrides`: `modifier_id` FK, `external_party`, `rule_type`,
  `rule_value`, `price`. One row per override rule, so a modifier can have zero, one, or many
  overrides depending on channel/fulfillment mode, without touching the base `modifiers.price`.

## Explicitly out of scope for this ticket

- Populating any of the new columns/tables from a real sync — there is no Otter menu
  normalizer yet (that's TAB-428, which this ticket's storage layer now unblocks).
- Backfilling `minimum_amount`/`maximum_amount`/nested groups from *Checkmate* payloads into the
  new columns — the normalizer gap for Checkmate is real (see above) but changing
  `normalize.ts`/`normalizeCheckmateMenus` behavior is a separate, deliberate decision outside
  this ticket's acceptance criteria ("existing Checkmate modifier functionality unaffected").
- The `external_id` party-discriminator gap — flagged above, not fixed here.
- Default modifier selections (`defaultModifierSelectionData`) — flagged, not modeled yet.
