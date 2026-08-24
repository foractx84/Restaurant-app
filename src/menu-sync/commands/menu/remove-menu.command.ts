// {
//   "type": "REMOVE",
//   "key": "8cb216ca-0837-473b-85f7-c03027a00859",
//   "value": {
//     "id": "8cb216ca-0837-473b-85f7-c03027a00859",
//     "name": "Testing Menu 3",
//     "hours": {
//       "Friday": [],
//       "Monday": [],
//       "Sunday": [],
//       "Tuesday": [],
//       "Saturday": [],
//       "Thursday": [],
//       "Wednesday": []
//     },
//     "sections": [
//     {
//       "id": "6041574f-280e-4d6a-8dbf-5ef37bafdb5f",
//       "name": "Test Section",
//       "items": [
//         {
//           "id": "2e01d161-2772-462f-b507-ec52f7daa50f",
//           "name": "Test Item for test section",
//           "price": 0,
//           "description": "",
//           "modifierGroups": [
//             {
//               "id": "057e986b-3ea3-41b8-8238-7e3dfd1cd964",
//               "name": "Test Modifier Group",
//               "modifiers": [
//                 {
//                   "id": "79813c54-9191-4222-be86-89a9dbb38015",
//                   "name": "Test Modifier",
//                   "price": 750,
//                   "description": "This is a test"
//                 }
//               ]
//             }
//           ]
//         }
//       ],
//       "description": ""
//     }
//     ],
//     "description": ""
//   },
//   "path": "$.$root[?(@.id=='8cb216ca-0837-473b-85f7-c03027a00859')]",
//   "valueType": "Object",
//   "entity": "menu",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "8cb216ca-0837-473b-85f7-c03027a00859",
//     "sectionId": null,
//     "itemId": null,
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": [],
//   "id": "8cb216ca-0837-473b-85f7-c03027a00859"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuEntity } from '@entities/menus.entity';
import { EntityManager } from 'typeorm';

class RemoveMenuCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.value.id;
    logger.info(`EXECUTING COMMAND - REMOVE MENU { externalID: ${externalID} }`);

    // get menu by external id
    const menu: MenuEntity = await ctx.menuService.getMenuByExternalID(externalID, manager);

    // if menu does not exist then throw error
    if (!menu) {
      throw new Error(`Menu { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_id } = menu;

    await ctx.softDeleteService.softDeleteMenuByID(menu_id, manager);

    logger.info(`EXECUTION COMPLETE - REMOVE MENU { externalID: ${externalID}, menu_id: ${menu_id} }`);
  }
}

export default RemoveMenuCommand;
