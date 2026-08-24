// {
//   "type":"UPDATE",
//   "key":"604ee6d4-17bb-4d20-8eba-69ce9ff7df06",
//   "id": "604ee6d4-17bb-4d20-8eba-69ce9ff7df06"
//   "value":{
//     "name":"Velveeta",
//     "price":50,
//     "description":""
//   },
//   "oldValue":{
//     "name":"Velveeta New",
//     "price":1000,
//     "description":"This is expensive cheese"
//   },
//   "path":"$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].modifierGroups[?(@.id=='306773fe-ca63-41fb-b582-97ba59240787')].modifiers[?(@.id=='604ee6d4-17bb-4d20-8eba-69ce9ff7df06')].name",
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
//   "keys":["name","price","description"]
//   "id":"604ee6d4-17bb-4d20-8eba-69ce9ff7df06"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { ModifierEntity } from '@entities/modifier.entity';
import { EditModifierRequestInterface } from '@interfaces/modifier.interface';
import { NormalizedModifier } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class UpdateModifierCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.modifierId;
    const values: Partial<NormalizedModifier> = this.op.value;
    const keys: Set<string> = new Set(this.op.keys ?? []);

    logger.info(`EXECUTING COMMAND - UPDATE MODIFIER { externalID: ${externalID} }`);

    // get modifier by external id.
    const modifier: ModifierEntity = await ctx.modifierService.getModifierByExternalID(externalID, manager);

    // if modifier does not exist then throw error
    if (!modifier) {
      throw new Error(`Modifier { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { modifierID, name, description, price, isHidden } = modifier;
    const request: EditModifierRequestInterface = {
      modifierID,
      name: keys.has('name') ? values.name : name,
      description: keys.has('description') ? values.description : description,
      price: keys.has('price') ? values.price : price,
      isHidden: keys.has('isHidden') ? values.isHidden : isHidden,
    };

    // update modifier
    await ctx.modifierService.editModifier(request, modifier, manager);

    logger.info(
      `EXECUTION COMPLETE - UPDATED MODIFIER { modifierID: ${modifierID}, externalID: ${externalID} }, ${JSON.stringify(
        values,
      )}, keys: ${JSON.stringify([...keys])}`,
      undefined,
      2,
    );
  }
}

export default UpdateModifierCommand;
