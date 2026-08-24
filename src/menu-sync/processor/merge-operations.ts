import { Operation } from 'json-diff-ts';
import { EnrichedOperation } from '@menu-sync/interfaces/menu-sync.interface';

/**
 * @fileoverview Merges multiple UPDATE operations targeting the same entity
 * into a single operation, reducing redundant database writes and eliminating
 * intra-transaction race conditions on the same row.
 *
 * @see {@link Documentation/MENU_SYNC.md#9-mergeupdateoperations}
 */

export const getIDForEntity = (op: EnrichedOperation): string => {
  const { entity, context } = op;
  let id = '';
  switch (entity) {
    case 'modifier':
      id = context.modifierId;
      break;
    case 'modifierGroup':
      id = context.modifierGroupId;
      break;
    // case 'itemImage':
    case 'item':
      id = context.itemId;
      break;
    case 'section':
      id = context.sectionId;
      break;
    case 'hours':
    case 'menu':
      id = context.menuId;
      break;
    default:
      throw new Error('Unknown entity encountered when generating key for merge operation.');
  }
  return id;
};

const generateKeyForMerge = (op: EnrichedOperation): string => {
  const id = getIDForEntity(op);

  return `${op.entity}:${id}`;
};

/**
 * Collapses multiple UPDATE operations targeting the same entity row into a
 * single operation whose `value` is the merged object of all field changes.
 *
 * `atomizeChangeset` emits one operation per changed field, so an entity with
 * three updated fields produces three separate operations. Executing them
 * individually results in redundant `UPDATE` queries and risks intra-transaction
 * race conditions on the same row. This function deduplicates them.
 *
 * Merge behaviour:
 * - Non-UPDATE operations pass through unchanged.
 * - `hours` UPDATE operations pass through unchanged. Hour records are
 *   identified by composite key rather than surrogate ID, making
 *   deduplication more complex; hours are instead handled as REMOVE + ADD pairs.
 * - For all other UPDATE operations, a merge key (`"<entity>:<id>"`) is
 *   computed. On the first occurrence the operation is stored with its `value`
 *   shaped as `{ [field]: newValue }`. On subsequent occurrences for the same
 *   key, `value`, `oldValue`, and `keys` are extended with the new field.
 *
 * The returned array places merged UPDATE operations before non-UPDATE
 * operations. Relative ordering within each group is not guaranteed —
 * final execution order is determined downstream by `orderCommands`.
 *
 * @param ops - Enriched operations array from `enrichOperation`.
 * @returns A deduplicated array where each entity appears at most once in
 *   the UPDATE group, with all changed fields combined into a single operation.
 *
 * @see {@link Documentation/MENU_SYNC.md#9-mergeupdateoperations}
 */
export const mergeUpdateOperations = (ops: EnrichedOperation[]): EnrichedOperation[] => {
  const nonUpdateOps = ops.filter(op => op.type !== Operation.UPDATE || op.entity === 'hours');
  const merged = new Map<string, EnrichedOperation>();

  for (const op of ops) {
    if (op.type !== Operation.UPDATE || op.entity === 'hours') {
      // only interested in UPDATE operations for merging of values
      continue;
    }

    const key: string = generateKeyForMerge(op);

    if (merged?.has(key)) {
      // Merge fields into existing command
      const existing = merged?.get(key);
      existing.value = { ...existing.value, [op.key]: op.value };
      existing.oldValue = { ...existing.oldValue, [op.key]: op.oldValue };
      existing.keys = [...(existing?.keys ?? []), op.key];
    } else {
      merged.set(key, {
        ...op,
        key: op.id ?? '',
        valueType: 'Object',
        value: { [op.key]: op.value },
        keys: [op.key],
        oldValue: { [op.key]: op.oldValue },
      });
    }
  }

  return [...merged?.values(), ...nonUpdateOps];
};
