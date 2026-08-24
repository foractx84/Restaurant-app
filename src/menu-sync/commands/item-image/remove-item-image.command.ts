// {
//   "type": "REMOVE",
//   "key": "0",
//   "value": {
//   "link": "https://d2q8km48t273sa.cloudfront.net/menu_photos/225501/menu_library/c26ab63c0bc1adc562df959dda2a586c.jpg"
// },
//   "path": "$.$root[0].sections[?(@.id=='ac38f95d-6793-4e87-a73d-b3c8d51cd40e')].items[?(@.id=='9c140c34-a920-4ad0-a202-e4bd914b2794')].image_urls[0]",
//   "valueType": "Object"
// },

import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { MenuItemMediaEntity } from '@entities/menuItemMedia.entity';
import { EntityManager } from 'typeorm';

class RemoveItemImageCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.itemId;
    const itemImage = this.op.value as { link: string };
    const index = Number(this.op.key);
    logger.info(`EXECUTING COMMAND - REMOVE IMAGE AT INDEX[${index}] FOR ITEM: { externalID: ${externalID} }`);

    // get item by external id
    const item: MenuItemEntity = await ctx.menuItemService.getMenuItemByExternalID(externalID, manager);

    if (!item.media || item.media?.length === 0) {
      throw new Error('No images exist for item. Will need to look into this issue if prevalent.');
    }

    const image: MenuItemMediaEntity = item.media.find(_media => _media.media_url === itemImage.link);
    logger.info(`REMOVING IMAGE { menu_item_media_id: ${image.menu_item_media_id} } FROM ITEM { externalID: ${externalID} }`);
    await ctx.menuItemMediaService.softDeleteMenuItemMediaByIDs([image.menu_item_media_id], item.menu_item_id, manager);

    logger.info(`EXECUTION COMPLETE - REMOVE IMAGE FROM ITEM { externalID: ${externalID}, menu_item_id: ${item.menu_item_id} }`);
  }
}

export default RemoveItemImageCommand;
