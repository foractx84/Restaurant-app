import { MenuCommand } from '@menu-sync/commands/base.command';

/**
 * @fileoverview Sorts `MenuCommand` instances into a safe execution order
 * that satisfies foreign key constraints and produces correct results across
 * all operation types.
 *
 * @see {@link Documentation/MENU_SYNC.md#12-ordercommands}
 */

/**
 * Priority map defining the execution order for each `MenuCommand` class.
 * Lower numbers execute first. Commands are keyed by class name, which is
 * resolved at runtime via `constructor.name`.
 *
 * Ordering rationale:
 * - **REMOVEs first (1–7), children before parents** — foreign key constraints
 *   require child rows to be deleted before their parent row is removed.
 *   Deepest entity (modifier) is removed first, shallowest (menu) last.
 * - **ADDs next (8–13), parents before children** — foreign key constraints
 *   require the parent row to exist before a child row is inserted.
 *   Shallowest entity (menu) is added first, deepest (modifier) last.
 * - **Hours and UPDATEs after structural changes (15–21)** — ensures the row
 *   exists before it is updated, and that hours are applied to a fully
 *   settled menu structure.
 * - **SORTs last (22–26)** — sort order is only meaningful once the final
 *   set of rows is in place. Ordered shallowest to deepest.
 *
 * `RemoveItemImageCommand`, `AddItemImageCommand`, and `UpdateItemImageCommand`
 * are included for forward compatibility but are not currently active.
 *
 * Any command not present in this map receives priority `99` and sorts to the end.
 */
const EXECUTION_ORDER: Record<string, number> = {
  RemoveModifierCommand: 1,
  RemoveModifierGroupCommand: 2,
  RemoveItemImageCommand: 3,
  RemoveItemCommand: 4,
  RemoveSectionCommand: 5,
  RemoveMenuHourCommand: 6,
  RemoveMenuCommand: 7,
  AddMenuCommand: 8,
  AddSectionCommand: 9,
  AddItemImageCommand: 10,
  AddItemCommand: 11,
  AddModifierGroupCommand: 12,
  AddModifierCommand: 13,
  AddMenuHourCommand: 14,
  UpdateMenuCommand: 15,
  UpdateSectionCommand: 16,
  UpdateItemImageCommand: 17,
  UpdateItemCommand: 18,
  UpdateModifierGroupCommand: 19,
  UpdateModifierCommand: 20,
  SortMenusCommand: 21,
  SortSectionsCommand: 22,
  SortItemsCommand: 23,
  SortModifierGroupsCommand: 24,
  SortModifiersCommand: 25,
};

/**
 * Sorts an array of `MenuCommand` instances into the execution order defined
 * by `EXECUTION_ORDER`, using each command's class name as the lookup key.
 *
 * Does not mutate the input array — sorts a shallow copy.
 *
 * Commands absent from `EXECUTION_ORDER` are assigned priority `99` and sort
 * to the end. This is a safe fallback during development but should be treated
 * as a misconfiguration in production — every active command class should have
 * an explicit priority entry.
 *
 * @param commands - Unsorted array of `MenuCommand` instances produced by
 *   `commandFactory`.
 * @returns A new array sorted by ascending execution priority.
 *
 * @see {@link Documentation/MENU_SYNC.md#12-ordercommands}
 */
export const orderCommands = (commands: MenuCommand[]): MenuCommand[] => {
  return [...commands].sort((a, b) => {
    const aPriority = EXECUTION_ORDER[a.constructor.name] ?? 99;
    const bPriority = EXECUTION_ORDER[b.constructor.name] ?? 99;
    return aPriority - bPriority;
  });
};
