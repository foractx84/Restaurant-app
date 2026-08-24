// {
//   "type": "SORT",
//   "key": "1067",
//   "path": "$.$root",
//   "valueType": "Array",
//   "value": [
//     "4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9",
//     "b6279a73-1922-4003-b0da-827c4022bfc0"
//   ],
//   "oldValue": [
//     "4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "b6279a73-1922-4003-b0da-827c4022bfc0",
//     "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9"
//   ],
//   "entity": "menu",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": null,
//     "sectionId": null,
//     "itemId": null,
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": [],
//   "id": null
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { EntityManager } from 'typeorm';
import { logger } from '@utils/logger';
import { MenuEntity } from '@entities/menus.entity';

class SortMenusCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const locationID: number | null = this.op.context.locationId;
    const restaurantID: number = this.op.context.restaurantId;
    const menuExternalIDs: string[] = this.op.value;

    logger.info(`EXECUTING COMMAND - SORT MENUS FOR RESTAURANT { restaurantID: ${restaurantID}, locationID: ${locationID} }`);

    // locationID is a Checkmate-specific external identifier stored on the restaurant row itself.
    // Platforms that identify restaurants another way (e.g. Otter) pass null and are verified by
    // restaurantID alone.
    const restaurant =
      locationID != null
        ? await ctx.restaurantService.findRestaurantEntityByIDAndLocationID(restaurantID, locationID, manager)
        : await ctx.restaurantService.findRestaurantEntityByID(restaurantID);

    if (!restaurant) {
      throw new Error(
        `Restaurant { restaurantID: ${restaurantID} } with locationID: ${locationID} does not exist. Will need to look into this issue if prevalent.`,
      );
    }

    const menus: MenuEntity[] = restaurant.menus.filter(menu => !menu.deleted);
    const menuIDs: number[] = menuExternalIDs.map(externalID => menus.find(menu => menu.external_id === externalID)?.menu_id).filter(Boolean);

    logger.debug(`SORTING MENUS WITH IDS: ${JSON.stringify(menuIDs)}`);

    await ctx.menuService.reorderMenus(restaurantID, menuIDs, manager);

    logger.info(`EXECUTION COMPLETE - SORT MENUS ${JSON.stringify(menuExternalIDs)} FOR RESTAURANT { restaurantID: ${restaurantID} }`);
  }
}

export default SortMenusCommand;
