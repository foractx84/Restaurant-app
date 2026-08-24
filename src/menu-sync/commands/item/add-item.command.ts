// {
//   "type":"ADD",
//   "key":"591e6fbe-8af6-4d80-b94f-4efd034b86d3",
//   "value":{
//     "id":"591e6fbe-8af6-4d80-b94f-4efd034b86d3",
//     "name":"Apple Crisp",
//     "description":"Wedged apples / coconut cinnamon strudel / caramel sauce",
//     "price":300,
//     "modifierGroups": []
//   },
//   "path":"$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='926b9c8c-e5d6-40fb-a358-fca42798ce1a')].items[?(@.id=='591e6fbe-8af6-4d80-b94f-4efd034b86d3')]",
//   "valueType":"Object",
//   "entity":"item",
//   "context":{
//     "locationId": 225569,
//     "restaurantId":1067,
//     "menuId":"30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "sectionId":"926b9c8c-e5d6-40fb-a358-fca42798ce1a",
//     "itemId":"591e6fbe-8af6-4d80-b94f-4efd034b86d3",
//     "modifierGroupId":null,
//     "modifierId":null,
//     "day":null,
//     "index":null
//   },
//   "keys":[],
//   "id":"591e6fbe-8af6-4d80-b94f-4efd034b86d3"
// }

// {
//   "type": "ADD",
//   "key": "d1f8ceb8-a129-46a6-a365-059dc43f842b",
//   "value": {
//     "id": "d1f8ceb8-a129-46a6-a365-059dc43f842b",
//     "name": "Apple Crisp",
//     "description": "Wedged apples / coconut cinnamon strudel / caramel sauce",
//     "price": 300,
//     "modifierGroups": [
//       {
//       "id": "a2cd6065-e26e-4f07-80ca-b6b89febb4b1",
//       "name": "Test Modifier Group",
//       "modifiers": [
//         {
//           "id": "a2cd6065-e26e-4f07-80ca-b6b89febb4b1",
//           "name": "Test Modifier",
//           "price": 0,
//           "description": "This is a test"
//         }
//       ]
//     }
//   ]
// },
//   "path": "$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='926b9c8c-e5d6-40fb-a358-fca42798ce1a')].items[?(@.id=='d1f8ceb8-a129-46a6-a365-059dc43f842b\n')]",
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
// },
//   "keys": [],
//   "id": "d1f8ceb8-a129-46a6-a365-059dc43f842b"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { NormalizedMenuItem } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class AddItemCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager?: EntityManager) {
    const restaurantID: number = this.op.context.restaurantId;
    const sectionID: string = this.op.context.sectionId;
    const item: NormalizedMenuItem = this.op.value;

    logger.info(`EXECUTING COMMAND - ADD ITEM { externalID: ${item.id} }`);

    const section = await ctx.menuSectionService.getMenuSectionByExternalID(sectionID, manager);

    // if section does not exist then throw error
    if (!section) {
      throw new Error(`Section { externalID: ${sectionID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_section_id } = section;
    await ctx.menuDetailsService.createDetailsForMenuSection([item], menu_section_id, restaurantID, manager);

    logger.info(`EXECUTION COMPLETE - ADD ITEM ${JSON.stringify({ ...item, sectionID: sectionID, menuSectionID: menu_section_id })}`);
  }
}

export default AddItemCommand;
