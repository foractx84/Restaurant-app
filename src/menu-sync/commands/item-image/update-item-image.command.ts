// {
//   "type": "UPDATE",
//   "key": "link",
//   "value": "https://d2q8km48t273sa.cloudfront.net/menu_photos/225501/menu_library/db6069651f921bf731860a8d3b34bc46.jpg",
//   "oldValue": "https://d2q8km48t273sa.cloudfront.net/menu_photos/225501/menu_library/db6069651f921bf731860a8d3b34bc46.png",
//   "path": "$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='4f515989-7a16-46c1-baae-9908bb285fa2')].items[?(@.id=='fa3d6aa3-4e8b-43f2-a1cf-f27e56382e79')].imageURLs[0].link",
//   "valueType": "String"
// },
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';

import { MenuItemMediaEntity } from '@entities/menuItemMedia.entity';
import { EntityManager } from 'typeorm';

class UpdateItemImageCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const restaurantID: number = this.op.context.restaurantId;
    const itemID: string = this.op.context.itemId;
    const value: string = this.op.valueType;
    const oldValue: string = this.op.oldValue;

    logger.info(`EXECUTING COMMAND - UPDATE ITEM IMAGE { link: ${value} } FOR ITEM { externalID: ${itemID} }`);

    const item = await ctx.menuItemService.getMenuItemByExternalID(itemID, manager);

    if (!item.media || item.media?.length === 0) {
      throw new Error('No images exist for item. Will need to look into this issue if prevalent.');
    }

    const image: MenuItemMediaEntity = item.media.find(_media => _media.media_url === oldValue);
    logger.info(`REMOVING IMAGE { menu_item_media_id: ${image.menu_item_media_id} } FROM ITEM { externalID: ${itemID} }`);
    await ctx.menuItemMediaService.softDeleteMenuItemMediaByIDs([image.menu_item_media_id], item.menu_item_id, manager);

    await ctx.menuDetailsService.createDetailsForMenuItem([{ link: value }], item.menu_item_id, restaurantID, manager);

    logger.info(`EXECUTION COMPLETE - UPDATE IMAGE { link: ${value} } FOR ITEM  { externalID: ${itemID}, menu_item_id: ${item.menu_item_id} )`);
  }
}

export default UpdateItemImageCommand;
