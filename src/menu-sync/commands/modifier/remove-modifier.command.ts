// {
//   "type":"REMOVE",
//   "key":"604ee6d4-17bb-4d20-8eba-69ce9ff7df06",
//   "value":{
//     "id":"604ee6d4-17bb-4d20-8eba-69ce9ff7df06",
//     "name":"Velveeta",
//     "price":1000,
//     "description":""
//   },
//   "path":"$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].modifierGroups[?(@.id=='306773fe-ca63-41fb-b582-97ba59240787')].modifiers[?(@.id=='604ee6d4-17bb-4d20-8eba-69ce9ff7df06')]",
//   "valueType":"Object",
//   "entity":"modifier",
//   "context":{
//     "locationId": 225569,
//     "restaurantId":1067,
//     "menuId":"4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "sectionId":"7edb30b4-165a-4d04-aecb-9a6641b8f79e",
//     "itemId":"97e2493f-9eab-4fba-8b08-4ad63c0a98c0",
//     "modifierGroupId":"306773fe-ca63-41fb-b582-97ba59240787",
//     "modifierId":"604ee6d4-17bb-4d20-8eba-69ce9ff7df06",
//     "day":null,
//     "index":null
//   },
//   "keys":[],
//   "id":"604ee6d4-17bb-4d20-8eba-69ce9ff7df06"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class RemoveModifierCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.modifierId;
    logger.info(`EXECUTING COMMAND - REMOVE MODIFIER { externalID: ${externalID} }`);

    // soft delete modifier
    await ctx.modifierService.softDeleteModifierByExternalID(externalID, manager);

    logger.info(`EXECUTION COMPLETE - REMOVE MODIFIER { externalID: ${externalID} }`);
  }
}

export default RemoveModifierCommand;
