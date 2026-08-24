// {
//   "type": "SORT",
//   "key": "057e986b-3ea3-41b8-8238-7e3dfd1cd964",
//   "path": "$.$root[?(@.id=='ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9')].sections[?(@.id=='6041574f-280e-4d6a-8dbf-5ef37bafdb5f')].items[?(@.id=='2e01d161-2772-462f-b507-ec52f7daa50f')].modifierGroups[?(@.id=='057e986b-3ea3-41b8-8238-7e3dfd1cd964')].modifiers[]",
//   "valueType": "Array",
//   "value": ["4cbe44b3-77ff-4d94-b07f-e4d16d418272", "a69da893-ef22-43b1-9903-a9008752adf9"],
//   "oldValue": ["a69da893-ef22-43b1-9903-a9008752adf9", "4cbe44b3-77ff-4d94-b07f-e4d16d418272"],
//   "entity": "modifier",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9",
//     "sectionId": "6041574f-280e-4d6a-8dbf-5ef37bafdb5f",
//     "itemId": "2e01d161-2772-462f-b507-ec52f7daa50f",
//     "modifierGroupId": "057e986b-3ea3-41b8-8238-7e3dfd1cd964",
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
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';
import { ModifierEntity } from '@entities/modifier.entity';

class SortModifiersCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const modifierGroupID: string = this.op.context.modifierGroupId;
    const modifierExternalIDs: string[] = this.op.value;

    logger.info(`EXECUTING COMMAND - SORT MODIFIERS ${JSON.stringify(modifierExternalIDs)} FOR MODIFIER GROUP { externalID: ${modifierGroupID} }`);

    const modifierGroup: ModifierGroupEntity = await ctx.modifierGroupService.getModifierGroupByExternalID(modifierGroupID, manager);

    // if modifier group does not exist then throw error
    if (!modifierGroup) {
      throw new Error(`Modifier Group { externalID: ${modifierGroupID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { modifierGroupID: groupID } = modifierGroup;
    const modifiers: ModifierEntity[] = modifierGroup.modifierToModifierGroupLinks.map(link => link.modifier).filter(Boolean);

    const modIDs: number[] = modifierExternalIDs
      .map(externalID => modifiers.find(modifier => modifier.externalID === externalID)?.modifierID)
      .filter(Boolean);

    logger.debug(`SORTING MODIFIERS WITH IDS: ${JSON.stringify(modIDs)}`);

    await ctx.modifierGroupService.linkModifiersToModifierGroup({ modifierGroupID: groupID, modifierIDs: modIDs }, manager);

    logger.info(
      `EXECUTION COMPLETE - SORT MODIFIERS ${JSON.stringify(
        modIDs,
      )} FOR MODIFIER GROUP { modifierGroupID: ${groupID}, externalID: ${modifierGroupID} }`,
    );
  }
}

export default SortModifiersCommand;
