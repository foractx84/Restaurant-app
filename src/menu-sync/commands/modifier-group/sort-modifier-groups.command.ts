// {
//   "type": "SORT",
//   "key": "2e01d161-2772-462f-b507-ec52f7daa50f",
//   "path": "$.$root[?(@.id=='ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9')].sections[?(@.id=='6041574f-280e-4d6a-8dbf-5ef37bafdb5f')].items[?(@.id=='2e01d161-2772-462f-b507-ec52f7daa50f')].modifierGroups[]",
//   "valueType": "Array",
//   "value": ["057e986b-3ea3-41b8-8238-7e3dfd1cd964", "38d35ee6-fb8d-4951-beb4-8248883e64f8"],
//   "oldValue": [
//     "057e986b-3ea3-41b8-8238-7e3dfd1cd964",
//     "38d35ee6-fb8d-4951-beb4-8248883e64f8",
//     "206acc37-22ce-4730-8d8f-4b584eece489"
//   ],
//   "entity": "modifierGroup",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9",
//     "sectionId": "6041574f-280e-4d6a-8dbf-5ef37bafdb5f",
//     "itemId": "2e01d161-2772-462f-b507-ec52f7daa50f",
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": [],
//   "id": null
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { EntityManager } from 'typeorm';
import { logger } from '@utils/logger';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';

class SortModifierGroupsCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const restaurantID: number = this.op.context.restaurantId;
    const itemID: string = this.op.context.itemId;
    const modifierGroupExternalIDs: string[] = this.op.value;

    logger.info(`EXECUTING COMMAND - SORT MODIFIER GROUPS ${JSON.stringify(modifierGroupExternalIDs)} FOR ITEM { externalID: ${itemID} }`);

    const item: MenuItemEntity = await ctx.menuItemService.getMenuItemByExternalID(itemID, manager);

    // if item does not exist then throw error
    if (!item) {
      throw new Error(`Item { externalID: ${itemID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_item_id } = item;
    const modifierGroups: ModifierGroupEntity[] = item.modifierGroupToMenuItemLinks.map(link => link.modifierGroup);

    const groupIDs: number[] = modifierGroupExternalIDs
      .map(externalID => modifierGroups.find(group => group.externalID === externalID)?.modifierGroupID)
      .filter(Boolean);

    logger.debug(`SORTING MODIFIER GROUPS WITH IDS: ${JSON.stringify(groupIDs)}`);

    await ctx.menuItemService.linkModifierGroupsToMenuItem(menu_item_id, groupIDs, restaurantID, manager);

    logger.info(
      `EXECUTION COMPLETE - SORT MODIFIER GROUPS ${JSON.stringify(groupIDs)} FOR ITEM { menu_item_id: ${menu_item_id}, externalID: ${itemID} }`,
    );
  }
}

export default SortModifierGroupsCommand;
