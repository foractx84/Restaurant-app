import { EnrichedOperation } from '@menu-sync/interfaces/menu-sync.interface';
import { Operation } from 'json-diff-ts';
import {
  NormalizedMenu,
  NormalizedMenuItem,
  NormalizedMenuSection,
  NormalizedModifier,
  NormalizedModifierGroup,
} from '@interfaces/platformIntegration.interface';

/**
 * @fileoverview Expands parent REMOVE operations into individual REMOVE
 * operations for every descendant entity in the subtree.
 *
 * TypeORM cascade soft-deletes are not leveraged here — soft deletes must
 * be performed manually per entity. Each node in the removed subtree
 * therefore requires its own explicit REMOVE operation.
 *
 * @future When TypeORM cascade soft-delete support is implemented on entity
 *   relationships, this module can be removed entirely. Cascade configuration
 *   on the ORM entities would handle child deletion automatically.
 *
 * @see {@link Documentation/MENU_SYNC.md#10-operationsexpander}
 */

/**
 * Expands parent REMOVE operations into a flat list of individual REMOVE
 * operations for every node in the removed subtree.
 *
 * `hours` and `modifier` REMOVE operations are passed through unchanged —
 * hours have no children, and modifiers are always leaf nodes.
 * All other REMOVE operations are routed to the appropriate expand function
 * based on `op.entity`.
 *
 * The returned array places all expanded child operations before the
 * non-expanded pass-through operations. Within the expanded group, children
 * always precede their parent (deepest first). Final execution order across
 * all operation types is enforced downstream by `orderCommands`.
 *
 * @param ops - Enriched operations array from `mergeUpdateOperations`.
 * @returns A flat array of enriched operations with all parent REMOVEs
 *   decomposed into per-entity REMOVEs.
 * @throws {Error} If a REMOVE operation carries an unrecognised entity type.
 *
 * @see {@link Documentation/MENU_SYNC.md#10-operationsexpander}
 */
export const operationsExpander = (ops: EnrichedOperation[]): EnrichedOperation[] => {
  const noOps = ops.filter(op => op.type !== Operation.REMOVE || op.entity === 'hours' || op.entity === 'modifier');

  const expanded: EnrichedOperation[] = [];
  for (const op of ops) {
    if (op.type !== Operation.REMOVE || op.entity === 'hours' || op.entity === 'modifier') {
      // only interested in REMOVE operations for expanding of commands. No expansion required for hours and modifier
      continue;
    }

    switch (op.entity) {
      case 'modifierGroup':
        expanded.push(...expandModifierGroupOperation(op));
        break;
      case 'item':
        expanded.push(...expandItemOperation(op));
        break;
      case 'section':
        expanded.push(...expandSectionOperation(op));
        break;
      case 'menu':
        expanded.push(...expandMenuOperation(op));
        break;
      default:
        throw new Error('Unexpected entity encountered while expanding operations during menu sync.');
    }
  }

  return [...expanded, ...noOps];
};

const expandMenuOperation = (op: EnrichedOperation): EnrichedOperation[] => {
  const menu: Partial<NormalizedMenu> = op.value;
  const sections: NormalizedMenuSection[] = menu?.sections ?? [];

  if (sections.length === 0) {
    return [op];
  }

  const sectionOperations: EnrichedOperation[] = sections.map(section => {
    const id: string = section.id;
    const path = `${op.path}.sections[?(@.id=='${id}')]`;
    return { ...op, key: id, value: section, path, entity: 'section', context: { ...op.context, sectionId: id }, id };
  });

  const expanded: EnrichedOperation[] = [];
  for (const operation of sectionOperations) {
    const itemOperations: EnrichedOperation[] = expandSectionOperation(operation);
    expanded.push(...itemOperations);
  }

  return [...expanded, op];
};

const expandSectionOperation = (op: EnrichedOperation): EnrichedOperation[] => {
  const section: Partial<NormalizedMenuSection> = op.value;
  const items: NormalizedMenuItem[] = section?.items ?? [];

  if (items.length === 0) {
    return [op];
  }

  const itemOperations: EnrichedOperation[] = items.map(item => {
    const id: string = item.id;
    const path = `${op.path}.items[?(@.id=='${id}')]`;
    return { ...op, key: id, value: item, path, entity: 'item', context: { ...op.context, itemId: id }, id };
  });

  const expanded: EnrichedOperation[] = [];
  for (const operation of itemOperations) {
    const modifierGroupOperations: EnrichedOperation[] = expandItemOperation(operation);
    expanded.push(...modifierGroupOperations);
  }

  return [...expanded, op];
};

const expandItemOperation = (op: EnrichedOperation): EnrichedOperation[] => {
  const item: Partial<NormalizedMenuItem> = op.value;
  const modifierGroups: NormalizedModifierGroup[] = item?.modifierGroups ?? [];

  if (modifierGroups.length === 0) {
    return [op];
  }

  const modGroupOperations: EnrichedOperation[] = modifierGroups.map(modifierGroup => {
    const id: string = modifierGroup.id;
    const path = `${op.path}.modifierGroups[?(@.id=='${id}')]`;
    return { ...op, key: id, value: modifierGroup, path, entity: 'modifierGroup', context: { ...op.context, modifierGroupId: id }, id };
  });

  const expanded: EnrichedOperation[] = [];
  for (const operation of modGroupOperations) {
    const modifierOperations: EnrichedOperation[] = expandModifierGroupOperation(operation);
    expanded.push(...modifierOperations);
  }

  return [...expanded, op];
};

const expandModifierGroupOperation = (op: EnrichedOperation): EnrichedOperation[] => {
  const modifierGroup: Partial<NormalizedModifierGroup> = op.value;
  const modifiers: NormalizedModifier[] = modifierGroup?.modifiers ?? [];

  if (modifiers.length === 0) {
    return [op];
  }

  const operations: EnrichedOperation[] = modifiers.map(modifier => {
    const id: string = modifier.id;
    const path = `${op.path}.modifiers[?(@.id=='${id}')]`;
    return { ...op, key: id, value: modifier, path, entity: 'modifier', context: { ...op.context, modifierId: id }, id };
  });

  return [...operations, op];
};
