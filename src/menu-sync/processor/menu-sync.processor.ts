import { atomizeChangeset, diff } from 'json-diff-ts';
import { enrichOperation } from '@menu-sync/processor/diff-enricher';
import { IAtomicSyncChange, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { commandFactory } from '@menu-sync/commands/command-factory';
import { orderCommands } from '@menu-sync/processor/order-commands';
import { NormalizedMenu, NormalizedMenuHour } from '@interfaces/platformIntegration.interface';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { mergeUpdateOperations } from '@menu-sync/processor/merge-operations';
import { EntityManager } from 'typeorm';
import { operationsExpander } from '@menu-sync/processor/operations-expander';
import { sortOperationsGenerator } from '@menu-sync/processor/sort-operations-generator';

/**
 * @fileoverview Menu sync processor for Checkmate POS integration.
 * @see {@link Documentation/MENU_SYNC.md} for full system documentation.
 */

/**
 * Composite key function for hour entities, which lack surrogate IDs.
 * Used by `json-diff-ts` to track hour timespans by their time range
 * rather than array position.
 *
 * @param timespan - The hour entity being keyed.
 * @param shouldReturnKeyName - When `true`, returns the key property name
 *   (`'compositeKey'`); when `false`, returns the computed key value
 *   (`'HH:MM-HH:MM'`).
 * @returns The key name or key value depending on `shouldReturnKeyName`.
 *
 * @see {@link Documentation/MENU_SYNC.md#7-sortoperationsgenerator} for context on composite keys.
 *
 * @example
 * hourCompositeKey({ startTime: '09:00', endTime: '17:00' }, false);
 * // => '09:00-17:00'
 * hourCompositeKey({ startTime: '09:00', endTime: '17:00' }, true);
 * // => 'compositeKey'
 */
const hourCompositeKey = (timespan: NormalizedMenuHour, shouldReturnKeyName: boolean): string =>
  shouldReturnKeyName ? 'compositeKey' : `${timespan.startTime}-${timespan.endTime}`;

/**
 * Orchestrates the diff-based menu sync pipeline for Checkmate POS menus.
 * Transforms a structural diff between two normalized menu snapshots into
 * an ordered set of database commands executed within a single transaction.
 *
 * @see {@link Documentation/MENU_SYNC.md#5-diff-processor--menusyncprocessorprocess}
 */
export class MenuSyncProcessor {
  private readonly context: MenuUpdateContext;

  constructor(services: MenuUpdateContext) {
    this.context = services;
  }

  /**
   * Runs the full menu sync pipeline between two normalized menu states.
   *
   * Pipeline stages:
   * 1. `diff()` — structural diff between old and new menu JSON, keyed by entity ID.
   * 2. `atomizeChangeset()` — flattens the nested changeset into discrete atomic operations.
   * 3. `sortOperationsGenerator()` — injects SORT operations for reordered arrays.
   * 4. `enrichOperation()` — parses each operation's path to resolve entity type and context IDs.
   * 5. `mergeUpdateOperations()` — collapses multiple UPDATE ops for the same entity into one.
   * 6. `operationsExpander()` — expands parent REMOVE ops into individual child REMOVE ops.
   * 7. `commandFactory()` — maps each operation to a concrete `MenuCommand` instance.
   * 8. `orderCommands()` — sorts commands to respect foreign key constraints.
   * 9. `cmd.execute()` — executes each command against the database within the transaction.
   *
   * All database writes share the provided `EntityManager` transaction. If any
   * command fails the transaction rolls back in full and no snapshot is written.
   *
   * @param oldData - Normalized menu state from the latest stored snapshot.
   * @param newData - Normalized menu state freshly fetched from the Checkmate API.
   * @param restaurantID - Internal restaurant identifier.
   * @param locationID - Checkmate location identifier, used to scope auth and logging. Platforms
   *   that don't identify restaurants this way (e.g. Otter) pass `null` — it's only used for the
   *   informational `context.locationId` on enriched operations, not for any lookup here.
   * @param manager - Active TypeORM transaction manager shared across all commands.
   *
   * @throws {HttpException} 500 if any stage of the pipeline or any command execution fails.
   *
   * @see {@link Documentation/MENU_SYNC.md#5-diff-processor--menusynprocessorprocess-continued}
   */
  async process(oldData: NormalizedMenu[], newData: NormalizedMenu[], restaurantID: number, locationID: number | null, manager: EntityManager) {
    const changes = diff(oldData, newData, {
      embeddedObjKeys: {
        '.': 'id',
        '.sections': 'id',
        '.sections.items': 'id',
        '.sections.items.modifierGroups': 'id',
        '.sections.items.modifierGroups.modifiers': 'id',
        '.hours.Monday': hourCompositeKey,
        '.hours.Tuesday': hourCompositeKey,
        '.hours.Wednesday': hourCompositeKey,
        '.hours.Thursday': hourCompositeKey,
        '.hours.Friday': hourCompositeKey,
        '.hours.Saturday': hourCompositeKey,
        '.hours.Sunday': hourCompositeKey,
      },
    });

    try {
      const atomicOps = atomizeChangeset(changes);
      logger.debug(`Processing job with ${atomicOps?.length} atomic change operations.`);
      const atomicSyncOps: IAtomicSyncChange[] = sortOperationsGenerator(oldData, newData, restaurantID, atomicOps);
      logger.debug(`Processing job with ${atomicSyncOps?.length} atomic sync change operations.`);
      const enrichedOps = atomicSyncOps.map((op: IAtomicSyncChange) => enrichOperation(op, newData, restaurantID, locationID));
      logger.debug(`Processing job with ${enrichedOps?.length} enriched operations.`);
      const mergedOps = mergeUpdateOperations(enrichedOps);
      logger.debug(`Processing job with ${mergedOps?.length} merged operations.`);
      const expandedOps = operationsExpander(mergedOps);
      logger.debug(`Processing job with ${expandedOps?.length} expanded operations.`);
      const commands = expandedOps.map(commandFactory);
      const ordered = orderCommands(commands);
      logger.debug(`Commands generated from factory and ordered: ${JSON.stringify(ordered, undefined, 2)}`);

      try {
        for (const cmd of ordered) {
          await cmd.execute(this.context, manager);
        }
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        } else {
          logger.error(`Error occurred while executing menu sync commands. = ${error}`);
          throw new HttpException(
            500,
            getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while executing menu sync commands. Refer to logs for more info.`),
          );
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        logger.error(`Error occurred while processing menu sync commands. = ${error}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while processing menu sync commands. Refer to logs for more info.`),
        );
      }
    }
  }
}
