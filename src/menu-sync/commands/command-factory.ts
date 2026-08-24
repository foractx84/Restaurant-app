import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation } from '@menu-sync/interfaces/menu-sync.interface';
import { AddMenuCommand, RemoveMenuCommand, SortMenusCommand, UpdateMenuCommand } from '@menu-sync/commands/menu';
import { AddSectionCommand, RemoveSectionCommand, SortSectionsCommand, UpdateSectionCommand } from '@menu-sync/commands/section';
import { AddItemCommand, RemoveItemCommand, SortItemsCommand, UpdateItemCommand } from '@menu-sync/commands/item';
// import { AddItemImageCommand, RemoveItemImageCommand, UpdateItemImageCommand } from '@menu-sync/commands/item-image';
import {
  AddModifierGroupCommand,
  RemoveModifierGroupCommand,
  SortModifierGroupsCommand,
  UpdateModifierGroupCommand,
} from '@menu-sync/commands/modifier-group';
import { AddModifierCommand, RemoveModifierCommand, SortModifiersCommand, UpdateModifierCommand } from '@menu-sync/commands/modifier';
import { AddMenuHourCommand, RemoveMenuHourCommand } from '@menu-sync/commands/hour';

/**
 * @fileoverview Maps enriched operations to concrete `MenuCommand` instances
 * via a static lookup table.
 *
 * @see {@link Documentation/MENU_SYNC.md#11-commandfactory}
 */

/**
 * Static lookup table mapping entity type and operation type to the
 * corresponding `MenuCommand` constructor.
 *
 * Each entry covers the full set of operations supported for that entity.
 * `hours` does not support `UPDATE` or `SORT` — changed hour records are
 * expressed as a `REMOVE` of the old record followed by an `ADD` of the new one.
 *
 * @remarks
 * `itemImage` commands are stubbed out and not currently active. Uncomment
 * the `itemImage` entry and the corresponding `resolveEntity` branch in
 * `diff-enricher.ts` when image sync is implemented.
 */
const commandMap = {
  menu: { ADD: AddMenuCommand, REMOVE: RemoveMenuCommand, SORT: SortMenusCommand, UPDATE: UpdateMenuCommand },
  section: { ADD: AddSectionCommand, REMOVE: RemoveSectionCommand, SORT: SortSectionsCommand, UPDATE: UpdateSectionCommand },
  item: { ADD: AddItemCommand, REMOVE: RemoveItemCommand, SORT: SortItemsCommand, UPDATE: UpdateItemCommand },
  // itemImage: { ADD: AddItemImageCommand, REMOVE: RemoveItemImageCommand, UPDATE: UpdateItemImageCommand },
  modifierGroup: {
    ADD: AddModifierGroupCommand,
    REMOVE: RemoveModifierGroupCommand,
    SORT: SortModifierGroupsCommand,
    UPDATE: UpdateModifierGroupCommand,
  },
  modifier: { ADD: AddModifierCommand, REMOVE: RemoveModifierCommand, SORT: SortModifiersCommand, UPDATE: UpdateModifierCommand },
  hours: { ADD: AddMenuHourCommand, REMOVE: RemoveMenuHourCommand },
};

/**
 * Instantiates the correct `MenuCommand` for a given enriched operation by
 * looking up the command constructor in `commandMap` using `op.entity` and
 * `op.type` as keys.
 *
 * The factory is the single point that translates the data pipeline's output
 * into executable command objects. Adding support for a new entity or
 * operation type requires only a new command class and an entry in `commandMap`.
 *
 * @param op - An enriched operation from `operationsExpander`, carrying entity
 *   type, operation type, context IDs, and the value to be written.
 * @returns A `MenuCommand` instance ready to be sorted and executed.
 * @throws {Error} If no command is registered for the `op.entity` + `op.type`
 *   combination. This indicates either an unhandled entity type or an operation
 *   type not supported for that entity (e.g. `UPDATE` on `hours`).
 *
 * @see {@link Documentation/MENU_SYNC.md#11-commandfactory}
 */
export const commandFactory = (op: EnrichedOperation): MenuCommand => {
  const command = commandMap[op.entity]?.[op.type];
  if (!command) throw new Error(`No command for ${op.entity}:${op.type}`);
  return new command(op);
};
