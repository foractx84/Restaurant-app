import { IAtomicSyncChange } from '@menu-sync/interfaces/menu-sync.interface';
import { IAtomicChange } from 'json-diff-ts';
import {
  NormalizedMenu,
  NormalizedMenuItem,
  NormalizedMenuSection,
  NormalizedModifier,
  NormalizedModifierGroup,
} from '@interfaces/platformIntegration.interface';
import AtomicSyncChangeBuilder from '@menu-sync/builders/atomic-sync-change.builder';

/**
 * @fileoverview Generates SORT operations for reordered menu entity arrays.
 * `json-diff-ts` does not produce SORT operations natively — this module
 * detects order changes by comparing ID sequences between snapshots and
 * injects the corresponding operations into the pipeline.
 *
 * @see {@link Documentation/MENU_SYNC.md#7-sortoperationsgenerator}
 */

const generateSortMenusOperation = (oldMenus: NormalizedMenu[], newMenus: NormalizedMenu[], restaurantID: number): IAtomicSyncChange | null => {
  if ((oldMenus.length === 0 && newMenus.length > 0) || (oldMenus.length > 0 && newMenus.length === 0)) return null;

  const newIDs: string[] = newMenus.map(menu => menu.id);
  const oldIDs: string[] = oldMenus.map(menu => menu.id);

  if (haveIDsChanged(oldIDs, newIDs)) {
    return new AtomicSyncChangeBuilder()
      .setType('SORT')
      .setKey(String(restaurantID))
      .setPath('$.$root')
      .setValueType('Array')
      .setValue(newIDs)
      .setOldValue(oldIDs)
      .build();
  }
  return null;
};

const generateSortSectionsOperation = (
  oldSections: NormalizedMenuSection[],
  newSections: NormalizedMenuSection[],
  menuID: string,
): IAtomicSyncChange | null => {
  if ((oldSections.length === 0 && newSections.length > 0) || (oldSections.length > 0 && newSections.length === 0)) return null;

  const newIDs: string[] = newSections.map(section => section.id);
  const oldIDs: string[] = oldSections.map(section => section.id);

  if (haveIDsChanged(oldIDs, newIDs)) {
    return new AtomicSyncChangeBuilder()
      .setType('SORT')
      .setKey(menuID)
      .setPath(`$.$root[?(@.id=='${menuID}')].sections[]`)
      .setValueType('Array')
      .setValue(newIDs)
      .setOldValue(oldIDs)
      .build();
  }
  return null;
};

const generateSortItemsOperation = (
  oldItems: NormalizedMenuItem[],
  newItems: NormalizedMenuItem[],
  menuID: string,
  sectionID: string,
): IAtomicSyncChange | null => {
  if ((oldItems.length === 0 && newItems.length > 0) || (oldItems.length > 0 && newItems.length === 0)) return null;

  const newIDs: string[] = newItems.map(item => item.id);
  const oldIDs: string[] = oldItems.map(item => item.id);

  if (haveIDsChanged(oldIDs, newIDs)) {
    return new AtomicSyncChangeBuilder()
      .setType('SORT')
      .setKey(sectionID)
      .setPath(`$.$root[?(@.id=='${menuID}')].sections[?(@.id=='${sectionID}')].items[]`)
      .setValueType('Array')
      .setValue(newIDs)
      .setOldValue(oldIDs)
      .build();
  }
  return null;
};

/**
 * Generates a SORT operation for a modifier group's modifiers array if their
 * order has changed. Returns `null` if no sort is needed or if either array
 * is empty (indicating an ADD or REMOVE, not a reorder).
 *
 * @param oldModifierGroups - Modifier groups from the previous snapshot.
 * @param newModifierGroups - Modifier groups from the incoming menu data.
 * @param menuID - External ID of the parent menu.
 * @param sectionID - External ID of the parent section.
 * @param itemID - External ID of the parent item. Used as the operation key.
 * @returns An `IAtomicSyncChange` of type `SORT`, or `null` if no sort is needed.
 */
const generateSortModifierGroupsOperation = (
  oldModifierGroups: NormalizedModifierGroup[],
  newModifierGroups: NormalizedModifierGroup[],
  menuID: string,
  sectionID: string,
  itemID: string,
): IAtomicSyncChange | null => {
  if ((oldModifierGroups.length === 0 && newModifierGroups.length > 0) || (oldModifierGroups.length > 0 && newModifierGroups.length === 0))
    return null;

  const newIDs: string[] = newModifierGroups.map(group => group.id);
  const oldIDs: string[] = oldModifierGroups.map(group => group.id);

  if (haveIDsChanged(oldIDs, newIDs)) {
    return new AtomicSyncChangeBuilder()
      .setType('SORT')
      .setKey(itemID)
      .setPath(`$.$root[?(@.id=='${menuID}')].sections[?(@.id=='${sectionID}')].items[?(@.id=='${itemID}')].modifierGroups[]`)
      .setValueType('Array')
      .setValue(newIDs)
      .setOldValue(oldIDs)
      .build();
  }
  return null;
};

/**
 * Generates a SORT operation for a modifier group's modifiers array if their
 * order has changed. Returns `null` if no sort is needed or if either array
 * is empty (indicating an ADD or REMOVE, not a reorder).
 *
 * @param oldModifiers - Modifiers from the previous snapshot.
 * @param newModifiers - Modifiers from the incoming menu data.
 * @param menuID - External ID of the parent menu.
 * @param sectionID - External ID of the parent section.
 * @param itemID - External ID of the parent item.
 * @param modifierGroupID - External ID of the parent modifier group. Used as the operation key.
 * @returns An `IAtomicSyncChange` of type `SORT`, or `null` if no sort is needed.
 */
const generateSortModifiersOperation = (
  oldModifiers: NormalizedModifier[],
  newModifiers: NormalizedModifier[],
  menuID: string,
  sectionID: string,
  itemID: string,
  modifierGroupID: string,
): IAtomicSyncChange | null => {
  if ((oldModifiers.length === 0 && newModifiers.length > 0) || (oldModifiers.length > 0 && newModifiers.length === 0)) return null;

  const newIDs: string[] = newModifiers.map(modifier => modifier.id);
  const oldIDs: string[] = oldModifiers.map(modifier => modifier.id);

  if (haveIDsChanged(oldIDs, newIDs)) {
    return new AtomicSyncChangeBuilder()
      .setType('SORT')
      .setKey(modifierGroupID)
      .setPath(
        `$.$root[?(@.id=='${menuID}')].sections[?(@.id=='${sectionID}')].items[?(@.id=='${itemID}')].modifierGroups[?(@.id=='${modifierGroupID}')].modifiers[]`,
      )
      .setValueType('Array')
      .setValue(newIDs)
      .setOldValue(oldIDs)
      .build();
  }
  return null;
};

/**
 * Compares two ordered ID arrays to determine if their sequence has changed.
 * Returns `true` if lengths differ or any ID is in a different position.
 *
 * @param oldIDs - Ordered entity IDs from the previous snapshot.
 * @param newIDs - Ordered entity IDs from the incoming menu data.
 * @returns `true` if the sequences differ, `false` if identical.
 */
const haveIDsChanged = (oldIDs: string[], newIDs: string[]): boolean => {
  if (oldIDs.length !== newIDs.length) return true;
  return oldIDs.some((id, i) => id !== newIDs[i]);
};

/**
 * Extends the flat atomic operations array from `atomizeChangeset` with SORT
 * operations for any menu entity arrays whose order has changed between snapshots.
 *
 * Walks the full menu hierarchy recursively — menus → sections → items →
 * modifier groups → modifiers — and compares entity ID sequences at each level.
 * A SORT operation is injected wherever the sequence has changed.
 *
 * A SORT operation is NOT generated when either the old or new array is empty
 * at a given level. An empty old array means entities are being added for the
 * first time (covered by ADD operations); an empty new array means entities are
 * being removed (covered by REMOVE operations).
 *
 * @param oldMenus - Normalized menus from the previous snapshot (`oldData`).
 * @param newMenus - Normalized menus from the incoming Checkmate fetch (`newData`).
 * @param restaurantID - Internal restaurant identifier, passed to top-level sort generators.
 * @param ops - Flat atomic operations array produced by `atomizeChangeset`.
 * @returns The original `ops` array concatenated with any generated SORT operations.
 *
 * @see {@link Documentation/MENU_SYNC.md#7-sortoperationsgenerator}
 */
export const sortOperationsGenerator = (
  oldMenus: NormalizedMenu[],
  newMenus: NormalizedMenu[],
  restaurantID: number,
  ops: IAtomicChange[],
): IAtomicSyncChange[] => {
  const noOps = ops as IAtomicSyncChange[];
  const atomicSyncChanges: IAtomicSyncChange[] = [];

  // check menus need to be sorted
  const menuAtomicSyncChange = generateSortMenusOperation(oldMenus, newMenus, restaurantID);

  if (!!menuAtomicSyncChange) {
    atomicSyncChanges.push(menuAtomicSyncChange);
  }

  for (const menu of newMenus) {
    const { id: menuID, sections } = menu;
    const oldSections: NormalizedMenuSection[] = oldMenus.find(old => old.id === menuID)?.sections ?? [];

    if (oldSections.length === 0) {
      continue;
    }

    const sectionAtomicSyncChange = generateSortSectionsOperation(oldSections, sections, menuID);

    if (!!sectionAtomicSyncChange) {
      atomicSyncChanges.push(sectionAtomicSyncChange);
    }

    for (const section of sections) {
      const { id: sectionID, items } = section;
      const oldItems: NormalizedMenuItem[] = oldSections.find(old => old.id === sectionID)?.items ?? [];

      if (oldItems.length === 0) {
        continue;
      }

      const itemAtomicSyncChange = generateSortItemsOperation(oldItems, items, menuID, sectionID);

      if (!!itemAtomicSyncChange) {
        atomicSyncChanges.push(itemAtomicSyncChange);
      }

      for (const item of items) {
        const { id: itemID, modifierGroups } = item;
        const oldModGroups: NormalizedModifierGroup[] = oldItems.find(old => old.id === itemID)?.modifierGroups ?? [];

        if (oldModGroups.length === 0) {
          continue;
        }

        const modGroupAtomicSyncChange = generateSortModifierGroupsOperation(oldModGroups, modifierGroups, menuID, sectionID, itemID);

        if (!!modGroupAtomicSyncChange) {
          atomicSyncChanges.push(modGroupAtomicSyncChange);
        }

        for (const modifierGroup of modifierGroups) {
          const { id: modifierGroupID, modifiers } = modifierGroup;
          const oldModifiers: NormalizedModifier[] = oldModGroups.find(old => old.id === modifierGroupID)?.modifiers ?? [];

          if (oldModifiers.length === 0) {
            continue;
          }

          const modifiersAtomicSyncChange = generateSortModifiersOperation(oldModifiers, modifiers, menuID, sectionID, itemID, modifierGroupID);

          if (!!modifiersAtomicSyncChange) {
            atomicSyncChanges.push(modifiersAtomicSyncChange);
          }
        }
      }
    }
  }

  return [...noOps, ...atomicSyncChanges];
};
