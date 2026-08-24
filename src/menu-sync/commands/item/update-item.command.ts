// {
//   "type": "UPDATE",
//   "key": "11091a89-47bc-458b-878c-8694e39d3198",
//   "value": {
//     "price": 800,
//     "description": "Adding a description"
//    },
//   "oldValue": {
//     "price": 500,
//     "description": ""
//    },
//   "path": "$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].sections[?(@.id=='926b9c8c-e5d6-40fb-a358-fca42798ce1a')].items[?(@.id=='11091a89-47bc-458b-878c-8694e39d3198')].price",
//   "valueType": "Object",
//   "entity": "item",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "30c622ec-78ab-5693-b2cf-c8fec391a284",
//     "sectionId": "926b9c8c-e5d6-40fb-a358-fca42798ce1a",
//     "itemId": "11091a89-47bc-458b-878c-8694e39d3198",
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": ["price", "description"],
//   "id": "11091a89-47bc-458b-878c-8694e39d3198"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { EditMenuItemRequestInterface } from '@interfaces/menuItem.interface';
import { CreateItemSizeDto } from '@dtos/itemSize.dto';
import { NormalizedMenuItem } from '@interfaces/platformIntegration.interface';
import { MenuItemSizeTypesEntity } from '@entities/menuItemSizeTypes.entity';
import { EntityManager } from 'typeorm';

class UpdateItemCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.itemId;
    const values: Partial<NormalizedMenuItem> = this.op.value;
    const keys: Set<string> = new Set(this.op.keys ?? []);

    logger.info(`EXECUTING COMMAND - UPDATE ITEM { externalID: ${externalID} }`);

    const item = await ctx.menuItemService.getMenuItemByExternalID(externalID, manager);

    // if item does not exist then throw error
    if (!item) {
      throw new Error(`Item { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_item_id, menu_section_id, name, description, base_item_size_id, menu_item_sizes, is_hidden } = item;

    const nameVal: string = keys.has('name') ? values.name : name;
    const descriptionVal: string = keys.has('description') ? values.description : description;
    const isHiddenVal: boolean = keys.has('isHidden') ? values.isHidden : is_hidden;
    let price: CreateItemSizeDto;
    if (keys.has('price')) {
      price = {
        label: 'default',
        price: values.price,
      } as CreateItemSizeDto;
    } else {
      const itemSizes: MenuItemSizeTypesEntity[] = menu_item_sizes?.map(size => size?.item_sizes) ?? [];
      const baseItemSize = itemSizes.find(size => size.id === base_item_size_id);
      if (!baseItemSize) throw new Error(`No existing item size type when updating price for menu item with externalID: ${externalID}.`);

      price = {
        label: 'default',
        price: baseItemSize?.price,
      } as CreateItemSizeDto;
    }

    const editRequest: EditMenuItemRequestInterface = {
      menuItemID: menu_item_id,
      menuSectionID: menu_section_id,
      name: nameVal,
      description: descriptionVal,
      baseItemSize: price,
      allItemSizes: [price],
      category: 'food',
      isHidden: isHiddenVal,
    };

    await ctx.menuItemService.editMenuItem(editRequest, manager);

    logger.info(`EXECUTION COMPLETE - UPDATE ITEM ${JSON.stringify({ ...editRequest, externalID: externalID }, undefined, 2)}`);
  }
}

export default UpdateItemCommand;
