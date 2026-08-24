// {
//   "type":"ADD",
//   "key":"8cb216ca-0837-473b-85f7-c03027a00859",
//   "value":{
//     "id":"8cb216ca-0837-473b-85f7-c03027a00859",
//     "name":"Testing Menu 3",
//     "description":"",
//     "hours":{
//       "Monday": [
//        {
//          "startTime": "08:00",
//          "endTime": "20:30"
//         }
//       ],
//       "Tuesday": [
//         {
//           "startTime": "09:00",
//           "endTime": "20:30"
//         }
//       ],
//       "Wednesday":[],
//       "Thursday":[],
//       "Friday":[],
//       "Saturday":[],
//       "Sunday":[]
//     },
//     "sections":[
//     {
//       "id":"6041574f-280e-4d6a-8dbf-5ef37bafdb5f",
//       "name":"Test Section",
//       "description":"",
//       "items":[
//         {
//           "id":"2e01d161-2772-462f-b507-ec52f7daa50f",
//           "name":"Test Item for test section",
//           "description":"",
//           "price":0,
//           "modifierGroups":[
//             {
//               "id":"057e986b-3ea3-41b8-8238-7e3dfd1cd964",
//               "name":"Test Modifier Group",
//               "modifiers":[
//                 {
//                   "id":"79813c54-9191-4222-be86-89a9dbb38015",
//                   "name":"Test Modifier",
//                   "price":750,
//                   "description":"This is a test"
//                 }
//               ]
//             }
//           ]
//         }
//       ]
//     }
//   ]
//   },
//   "path":"$.$root[?(@.id=='8cb216ca-0837-473b-85f7-c03027a00859')]",
//   "valueType":"Object",
//   "entity":"menu",
//   "context":{
//     "locationId":225569,
//     "restaurantId":1067,
//     "menuId":"8cb216ca-0837-473b-85f7-c03027a00859",
//     "sectionId":null,
//     "itemId":null,
//     "modifierGroupId":null,
//     "modifierId":null,
//     "day":null,
//     "index":null
//   },
//   "keys":[],
//   "id":"8cb216ca-0837-473b-85f7-c03027a00859"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class AddMenuCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const locationID: number | null = this.op.context.locationId;
    const restaurantID: number = this.op.context.restaurantId;
    const menu: NormalizedMenu = this.op.value;

    logger.info(
      `EXECUTING COMMAND - ADD MENU { externalID: ${menu.id} } FOR RESTAURANT { restaurantID: ${restaurantID}, locationID: ${locationID} }`,
    );

    await ctx.menuDetailsService.createMenusDetailsFromNormalized([menu], restaurantID, locationID, manager);

    logger.info(`EXECUTION COMPLETE - ADD MENU { externalID: ${menu.id} } FOR RESTAURANT { restaurantID: ${restaurantID} }`);
  }
}

export default AddMenuCommand;
