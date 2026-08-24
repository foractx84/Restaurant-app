import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { EntityManager } from 'typeorm';
import { logger } from '@utils/logger';
import { MenuEntity } from '@entities/menus.entity';
import { MenuSectionEntity } from '@entities/menuSections.entity';

class SortSectionsCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const menuID: string = this.op.context.menuId;
    const sectionExternalIDs: string[] = this.op.value;

    logger.info(`EXECUTING COMMAND - SORT SECTIONS ${JSON.stringify(sectionExternalIDs)} FOR MENU { externalID: ${menuID} }`);

    const menu: MenuEntity = await ctx.menuService.getMenuByExternalID(menuID, manager);

    // if menu does not exist then throw error
    if (!menu) {
      throw new Error(`Menu { externalID: ${menuID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_id } = menu;
    const sections: MenuSectionEntity[] = menu.sections.filter(section => !section.deleted);
    const sectionIDs: number[] = sectionExternalIDs
      .map(externalID => sections.find(section => section.external_id === externalID)?.menu_section_id)
      .filter(Boolean);

    logger.debug(`SORTING SECTIONS WITH IDS: ${JSON.stringify(sectionIDs)}`);

    await ctx.menuSectionService.reorderMenuSections(menu_id, sectionIDs, manager);

    logger.info(`EXECUTION COMPLETE - SORT SECTIONS ${JSON.stringify(sectionExternalIDs)} FOR MENU { menu_id: ${menu_id}, externalID: ${menuID} }`);
  }
}

export default SortSectionsCommand;
