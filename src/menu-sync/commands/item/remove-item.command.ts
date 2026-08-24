// {
//   "type": "REMOVE",
//   "key": "d1f8ceb8-a129-46a6-a365-059dc43f842b",
//   "value": {
//     "id": "d1f8ceb8-a129-46a6-a365-059dc43f842b",
//     "name": "Apple Crisp",
//     "price": 300,
//     "description": "Wedged apples / coconut cinnamon strudel / caramel sauce",
//     "modifierGroups": [
//     {
//       "id": "a2cd6065-e26e-4f07-80ca-b6b89febb4b1",
//       "name": "Test Modifier Group",
//       "modifiers": [
//           {
//           "id": "a2cd6065-e26e-4f07-80ca-b6b89febb4b1",
//           "name": "Test Modifier",
//           "price": 0,
//           "description": "This is a test"
//           }
//         ]
//       }
//     ]
//   },
//   "path": "$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='926b9c8c-e5d6-40fb-a358-fca42798ce1a')].items[?(@.id=='d1f8ceb8-a129-46a6-a365-059dc43f842b')]",
//   "valueType": "Object",
//   "entity": "item",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "sectionId": "926b9c8c-e5d6-40fb-a358-fca42798ce1a",
//     "itemId": "d1f8ceb8-a129-46a6-a365-059dc43f842b",
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": [],
//   "id": "d1f8ceb8-a129-46a6-a365-059dc43f842b"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { EntityManager } from 'typeorm';

class RemoveItemCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.value.id;
    logger.info(`EXECUTING COMMAND - REMOVE ITEM { externalID: ${externalID} }`);

    // get item by external id
    const item: MenuItemEntity = await ctx.menuItemService.getMenuItemByExternalID(externalID, manager);

    // if item does not exist then throw error
    if (!item) {
      throw new Error(`Item { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_item_id } = item;

    await ctx.menuItemService.softDeleteMenuItemByID(menu_item_id, manager);

    logger.info(`EXECUTION COMPLETE - REMOVE ITEM { externalID: ${externalID}, menu_item_id: ${menu_item_id} }`);
  }
}

export default RemoveItemCommand;
