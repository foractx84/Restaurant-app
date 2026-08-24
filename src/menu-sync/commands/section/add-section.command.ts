// {
//   "type":"ADD",
//   "key":"e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//   "value":{
//     "id":"e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//     "name":"Test Section",
//     "description":"",
//     "items":[]
//   },
//   "path":"$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='e71ae44e-1eed-481f-8385-83b1b9d4d1dd')]",
//   "valueType":"Object",
//   "entity":"section",
//   "context":{
//     "locationId": 225569,
//     "restaurantId":1067,
//     "menuId":"30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "sectionId":"e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//     "itemId":null,
//     "modifierGroupId":null,
//     "modifierId":null,
//     "day":null,
//     "index":null
//   },
//   "keys":[],
//   "id":"e71ae44e-1eed-481f-8385-83b1b9d4d1dd"
// }

// {
//   "type": "ADD",
//   "key": "e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//   "value": {
//     "id": "e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//     "name": "Test Section",
//     "description": "",
//     "items": [
//     {
//       "id": "a21aa85b-562b-4ba8-91db-eeceb58d8dd3",
//       "name": "Test Item for test section",
//       "description": "",
//       "price": 200,
//       "modifierGroups": [
//         {
//           "id": "dd5556ce-bf9a-4cf8-b16f-104abe6a238a",
//           "name": "Test Modifier Group",
//           "modifiers": [
//             {
//               "id": "45980d8e-7d29-4051-8a23-f0f83bcf60bb",
//               "name": "Test Modifier",
//               "price": 0,
//               "description": "This is a test"
//             }
//           ]
//         }
//       ]
//     }
//   ]
// },
//   "path": "$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='e71ae44e-1eed-481f-8385-83b1b9d4d1dd')]",
//   "valueType": "Object",
//   "entity": "section",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "sectionId": "e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//     "itemId": null,
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": [],
//   "id": "e71ae44e-1eed-481f-8385-83b1b9d4d1dd"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { NormalizedMenuSection } from '@interfaces/platformIntegration.interface';
import { CreateMenuSectionsInterface, MenuSections } from '@interfaces/menuSections.interface';
import { EntityManager } from 'typeorm';

class AddSectionCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager?: EntityManager) {
    const restaurantID: number = this.op.context.restaurantId;
    const menuID: string = this.op.context.menuId;
    const section: NormalizedMenuSection = this.op.value;

    logger.info(`EXECUTING COMMAND - ADD SECTION { externalID: ${section.id} }`);

    const menu = await ctx.menuService.getMenuByExternalID(menuID, manager);

    // if menu does not exist then throw error
    if (!menu) {
      throw new Error(`Menu { externalID: ${menuID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_id } = menu;
    const menuSection: MenuSections = {
      name: section.name,
      message: section.description ?? null,
      externalID: section.id,
    };

    const menuSections: CreateMenuSectionsInterface = await ctx.menuSectionService.createMenuSections([menuSection], menu_id, manager);
    const createdSection: MenuSections = menuSections.menuSections[0];

    logger.debug(
      `CREATED MENU SECTION { externalID: ${createdSection.externalID}, menu_section_id: ${createdSection.menuSectionID} } for menu { menu_id: ${menu_id} }`,
    );

    await ctx.menuDetailsService.createDetailsForMenuSection(section.items, createdSection.menuSectionID, restaurantID, manager);

    logger.info(`EXECUTION COMPLETE - ADD SECTION ${JSON.stringify({ ...createdSection, menu_id: menu_id }, undefined, 2)}`);
  }
}

export default AddSectionCommand;
