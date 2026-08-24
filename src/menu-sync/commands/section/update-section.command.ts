// {
//   "type": "UPDATE",
//   "key": "741eae02-7eb7-410c-bf7b-5e190c9b2cc3",
//   "value": {
//     "name": "Test Section 3 Edited",
//     "description": "Now it has a description"
//   },
//   "oldValue": {
//     "name": "Test Section 3",
//     "description": ""
//   },
//   "path": "$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='741eae02-7eb7-410c-bf7b-5e190c9b2cc3')].name",
//   "valueType": "Object",
//   "entity": "section",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "sectionId": "741eae02-7eb7-410c-bf7b-5e190c9b2cc3",
//     "itemId": null,
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": [
//     "name",
//     "description"
//   ],
//   "id": "741eae02-7eb7-410c-bf7b-5e190c9b2cc3"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuSectionEntity } from '@entities/menuSections.entity';
import { NormalizedMenuSection } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class UpdateSectionCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.sectionId;
    const values: Partial<NormalizedMenuSection> = this.op.value;
    const keys: Set<string> = new Set(this.op.keys ?? []);

    logger.info(`EXECUTING COMMAND - UPDATE SECTION { externalID: ${externalID} }`);

    const menuSection: MenuSectionEntity = await ctx.menuSectionService.getMenuSectionByExternalID(externalID, manager);

    if (!menuSection) throw new Error(`Menu Section { externalID: ${externalID} } does not exist.`);

    const { menu_section_id } = menuSection;

    const name: string = keys.has('name') ? values.name : menuSection.name;
    const message: string = keys.has('description') ? values.description : menuSection.message;
    await ctx.menuSectionService.editMenuSection(menuSection.menu_id, menu_section_id, name, message, manager);

    logger.info(
      `EXECUTION COMPLETE - UPDATE SECTION ${JSON.stringify(
        {
          externalID: externalID,
          menuSectionID: menu_section_id,
          name,
          description: message,
        },
        undefined,
        2,
      )}`,
    );
  }
}

export default UpdateSectionCommand;
