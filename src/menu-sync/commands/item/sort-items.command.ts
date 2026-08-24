import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { EntityManager } from 'typeorm';
import { logger } from '@utils/logger';
import { MenuSectionEntity } from '@entities/menuSections.entity';
import { MenuItemEntity } from '@entities/menuItem.entity';

class SortItemsCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const sectionID: string = this.op.context.sectionId;
    const itemExternalIDs: string[] = this.op.value;

    logger.info(`EXECUTING COMMAND - SORT ITEMS ${JSON.stringify(itemExternalIDs)} FOR SECTION { externalID: ${sectionID} }`);

    const section: MenuSectionEntity = await ctx.menuSectionService.getMenuSectionByExternalID(sectionID, manager);

    // if section does not exist then throw error
    if (!section) {
      throw new Error(`Section { externalID: ${sectionID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_section_id } = section;
    const items: MenuItemEntity[] = section.menu_items.filter(item => !item.deleted);
    const itemIDs: number[] = itemExternalIDs.map(externalID => items.find(item => item.external_id === externalID)?.menu_item_id).filter(Boolean);

    logger.debug(`SORTING ITEMS WITH IDS: ${JSON.stringify(itemIDs)}`);

    await ctx.menuItemService.reorderMenuItems(menu_section_id, itemIDs, manager);

    logger.info(
      `EXECUTION COMPLETE - SORT ITEMS ${JSON.stringify(
        itemExternalIDs,
      )} FOR SECTION { menu_section_id: ${menu_section_id}, externalID: ${section} }`,
    );
  }
}

export default SortItemsCommand;
