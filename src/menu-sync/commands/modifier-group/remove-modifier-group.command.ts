// {
//   "type":"REMOVE",
//   "key":"60c33f25-5721-470e-bbe8-a35dbdb12463",
//   "value":{
//     "id":"60c33f25-5721-470e-bbe8-a35dbdb12463",
//     "name":"Test Group Edit",
//     "modifiers":[]
//   },
//   "path":"$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].modifierGroups[?(@.id=='60c33f25-5721-470e-bbe8-a35dbdb12463')]",
//   "valueType":"Object",
//   "entity":"modifierGroup",
//   "context":{
//     "locationId": 225569,
//     "restaurantId":1067,
//     "menuId":"4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "sectionId":"7edb30b4-165a-4d04-aecb-9a6641b8f79e",
//     "itemId":"97e2493f-9eab-4fba-8b08-4ad63c0a98c0",
//     "modifierGroupId":"60c33f25-5721-470e-bbe8-a35dbdb12463",
//     "modifierId":null,
//     "day":null,
//     "index":null
//   },
//   "keys":[],
//   "id":"60c33f25-5721-470e-bbe8-a35dbdb12463"
// }
// {
//   "type":"REMOVE",
//   "key":"60c33f25-5721-470e-bbe8-a35dbdb12463",
//   "value":{
//     "id":"60c33f25-5721-470e-bbe8-a35dbdb12463",
//     "name":"Test Group Edit",
//     "modifiers":[
//     {
//       "id":"7a73c8e8-7d78-4f20-ab80-4c51d2acb1b5",
//       "name":"Test Modifier",
//       "price":0,
//       "description":"This is another TEST description"
//     }
//   ]
//   },
//   "path":"$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].modifierGroups[?(@.id=='60c33f25-5721-470e-bbe8-a35dbdb12463')]",
//   "valueType":"Object",
//   "entity":"modifierGroup",
//   "context":{
//     "locationId": 225569,
//     "restaurantId":1067,
//     "menuId":"4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "sectionId":"7edb30b4-165a-4d04-aecb-9a6641b8f79e",
//     "itemId":"97e2493f-9eab-4fba-8b08-4ad63c0a98c0",
//     "modifierGroupId":"60c33f25-5721-470e-bbe8-a35dbdb12463",
//     "modifierId":null,
//     "day":null,
//     "index":null
//    },
//   "keys":[],
//   "id":"60c33f25-5721-470e-bbe8-a35dbdb12463"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';
import { EntityManager } from 'typeorm';

class RemoveModifierGroupCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager?: EntityManager) {
    const externalID: string = this.op.context.modifierGroupId;
    logger.info(`EXECUTING COMMAND - REMOVE MODIFIER GROUP { externalID: ${externalID} }`);

    // get modifier group by external id
    const modifierGroup: ModifierGroupEntity = await ctx.modifierGroupService.getModifierGroupByExternalID(externalID, manager);

    // if modifier group does not exist then throw error
    if (!modifierGroup) {
      throw new Error(`Modifier Group { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { modifierGroupID } = modifierGroup;
    await ctx.modifierGroupService.softDeleteModifierGroup(modifierGroup, manager);

    logger.info(`EXECUTION COMPLETE - REMOVE MODIFIER GROUP { externalID: ${externalID}, modifierGroupID: ${modifierGroupID} }`);
  }
}

export default RemoveModifierGroupCommand;
