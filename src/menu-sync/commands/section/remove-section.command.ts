// {
//   "type":"REMOVE",
//   "key":"e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//   "value":{
//     "id":"e71ae44e-1eed-481f-8385-83b1b9d4d1dd",
//     "name":"Test Section",
//     "items":[],
//     "description":""
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
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuSectionEntity } from '@entities/menuSections.entity';
import { EntityManager } from 'typeorm';

class RemoveSectionCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.value.id;
    logger.info(`EXECUTING COMMAND - REMOVE SECTION { externalID: ${externalID} }`);

    // get section by external id
    const section: MenuSectionEntity = await ctx.menuSectionService.getMenuSectionByExternalID(externalID, manager);

    // if section does not exist then throw error
    if (!section) {
      throw new Error(`Section { menu_section_id: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_section_id } = section;

    await ctx.softDeleteService.softDeleteMenuSectionByID(menu_section_id, manager);

    logger.info(`EXECUTION COMPLETE - REMOVE SECTION { externalID: ${externalID}, menu_section_id: ${menu_section_id} }`);
  }
}

export default RemoveSectionCommand;
