// {
//   "type": "ADD",
//   "key": "1",
//   "value": {
//   "link": "https://d2q8km48t273sa.cloudfront.net/menu_photos/225501/menu_library/705b3646db8ee3569c1fffcf098b5b60.png"
// },
//   "path": "$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].image_urls[1]",
//   "valueType": "Object"
// },

import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { EntityManager } from 'typeorm';

class AddItemImageCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const restaurantID: number = this.op.context.restaurantId;
    const itemID: string = this.op.context.itemId;
    const image: { link: string } = this.op.value;

    logger.info(`EXECUTING COMMAND - ADD IMAGE { link: ${image.link} } FOR ITEM  { externalID: ${itemID} }`);

    const item: MenuItemEntity = await ctx.menuItemService.getMenuItemByExternalID(itemID, manager);

    await ctx.menuDetailsService.createDetailsForMenuItem([image], item.menu_item_id, restaurantID, manager);

    logger.info(`EXECUTION COMPLETE - ADD IMAGE { link: ${image.link} } FOR ITEM  { externalID: ${itemID}, menu_item_id: ${item.menu_item_id} )`);
  }
}

export default AddItemImageCommand;
