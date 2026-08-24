import { EnrichedOperation, IAtomicSyncChange, TapTabEntity } from '@menu-sync/interfaces/menu-sync.interface';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { logger } from '@utils/logger';
import { getIDForEntity } from '@menu-sync/processor/merge-operations';

/**
 * @fileoverview Enriches flat atomic operations from `atomizeChangeset` with
 * entity type and context IDs parsed from each operation's JSONPath string.
 * Enriched operations carry everything a `MenuCommand` needs to execute
 * without re-parsing the path downstream.
 *
 * @see {@link Documentation/MENU_SYNC.md#8-enrichoperation}
 */

/**
 * Enriches a flat atomic operation with entity type, context IDs, and own ID —
 * transforming it into an `EnrichedOperation` ready for merging, expansion,
 * and command generation.
 *
 * Enrichment steps:
 * 1. Spreads the original operation fields.
 * 2. Resolves `entity` from the path via `resolveEntity`.
 * 3. Resolves `context` (all ancestor and own IDs) from the path via `resolveContext`.
 * 4. Derives `id` (the entity's own ID) from the resolved context via `getIDForEntity`.
 *
 * @param op - A flat atomic operation produced by `sortOperationsGenerator`.
 * @param menus - Full normalized menu array from the incoming Checkmate fetch.
 * @param restaurantID - Internal restaurant identifier.
 * @param locationID - Checkmate location identifier.
 * @returns An `EnrichedOperation` with entity, context, and id populated.
 *
 * @see {@link Documentation/MENU_SYNC.md#8-enrichoperation}
 */
export const enrichOperation = (
  op: IAtomicSyncChange,
  menus: NormalizedMenu[],
  restaurantID: number,
  locationID: number | null,
): EnrichedOperation => {
  const enriched: EnrichedOperation = {
    ...op,
    entity: resolveEntity(op.path),
    context: resolveContext(op.path, menus, restaurantID, locationID),
    keys: [],
  };
  enriched.id = getIDForEntity(enriched);

  logger.info(`ENRICHED OPERATION { entity: ${enriched.entity}, type: ${op.type}, key: ${op.key} }`);
  logger.debug(`ENRICHED OPERATION FULL ${JSON.stringify(enriched)}`);
  return enriched;
};

/**
 * Resolves the full context object for an operation by extracting every
 * relevant entity ID from the operation's JSONPath string via regex.
 *
 * IDs are parsed in path segment order — a path that reaches a modifier
 * will yield populated values for `menuId`, `sectionId`, `itemId`,
 * `modifierGroupId`, and `modifierId`. Segments not present in the path
 * resolve to `null`.
 *
 * @param path - JSONPath string from the atomic operation.
 * @param menus - Full normalized menu array from the incoming Checkmate fetch.
 *   Available for any context lookups that cannot be derived from the path alone.
 * @param restaurantID - Internal restaurant identifier.
 * @param locationID - Checkmate location identifier.
 * @returns A context object scoping the operation to its position in the hierarchy.
 *
 */
const resolveContext = (path: string, menus: NormalizedMenu[], restaurantID: number, locationID: number | null) => {
  const getDayForHours = (path: string): string | null => {
    const match = path.match(/hours\.(\w+)/);
    return match ? match[1] : null;
  };
  return {
    locationId: locationID,
    restaurantId: restaurantID,
    menuId: path.match(/\$root\[\?\(@\.id=='(.+?)'\)\]/)?.[1] ?? null,
    sectionId: path.match(/sections\[\?\(@\.id=='(.+?)'\)\]/)?.[1] ?? null,
    itemId: path.match(/items\[\?\(@\.id=='(.+?)'\)\]/)?.[1] ?? null,
    modifierGroupId: path.match(/modifierGroups\[\?\(@\.id=='(.+?)'\)\]/)?.[1] ?? null,
    modifierId: path.match(/modifiers\[\?\(@\.id=='(.+?)'\)\]/)?.[1] ?? null,
    day: getDayForHours(path),
    index: Number(path.match(/\[(\d+)\]/)?.[1]) ?? undefined,
  };
};

/**
 * Determines the entity type targeted by an operation by checking for
 * entity-specific path segments in order of specificity (deepest first).
 * Ensures a path referencing a modifier is not misclassified as an item.
 *
 * Precedence (highest to lowest):
 * `modifier` → `modifierGroup` → `item` → `section` → `hours` → `menu`
 *
 * @param path - JSONPath string from the atomic operation.
 * @returns The `TapTabEntity` type for this operation.
 */
const resolveEntity = (path: string): TapTabEntity => {
  if (path.includes('modifiers[')) return 'modifier';
  if (path.includes('modifierGroups[')) return 'modifierGroup';
  // if (path.includes('image_urls[')) return 'itemImage';
  if (path.includes('items[')) return 'item';
  if (path.includes('sections[')) return 'section';
  if (path.includes('hours')) return 'hours';
  return 'menu';
};
