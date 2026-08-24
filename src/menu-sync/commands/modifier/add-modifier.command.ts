// {
//   "type":"ADD",
//   "key":"764c1b45-9312-431d-b477-08bfe1fc43f6",
//   "value":{
//     "id":"764c1b45-9312-431d-b477-08bfe1fc43f6",
//     "name":"Munster",
//     "price":100,
//     "description":"This is the best cheese we got"
//   },
//   "path":"$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].modifierGroups[?(@.id=='306773fe-ca63-41fb-b582-97ba59240787')].modifiers[?(@.id=='764c1b45-9312-431d-b477-08bfe1fc43f6')]",
//   "valueType":"Object",
//   "entity":"modifier",
//   "context":{
//     "locationId": 225569,
//     "restaurantId":1067,
//     "menuId":"4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "sectionId":"7edb30b4-165a-4d04-aecb-9a6641b8f79e",
//     "itemId":"97e2493f-9eab-4fba-8b08-4ad63c0a98c0",
//     "modifierGroupId":"306773fe-ca63-41fb-b582-97ba59240787",
//     "modifierId":"764c1b45-9312-431d-b477-08bfe1fc43f6",
//     "day":null,
//     "index":null
//   },
//   "keys":[],
//   "id":"764c1b45-9312-431d-b477-08bfe1fc43f6"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { CreateModifierRequestInterface, ModifierResponse } from '@interfaces/modifier.interface';
import { NormalizedModifier } from '@interfaces/platformIntegration.interface';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';
import { EntityManager } from 'typeorm';

class AddModifierCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const groupExternalID: string = this.op.context.modifierGroupId;
    const modifier: NormalizedModifier = this.op.value;
    const externalModifierID: string = modifier.id;
    const restaurantID: number = this.op.context.restaurantId;

    logger.info(`EXECUTING COMMAND - ADD MODIFIER { externalID: ${externalModifierID} }`);

    // get modifier group for modifier
    const modifierGroup: ModifierGroupEntity = await ctx.modifierGroupService.getModifierGroupByExternalID(groupExternalID, manager);

    // if modifier group does not exist then throw error
    if (!modifierGroup) {
      throw new Error(`Modifier Group { externalID: ${groupExternalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { modifierGroupID } = modifierGroup;

    // create modifier
    const modifierRequest: CreateModifierRequestInterface = {
      name: modifier.name,
      description: modifier.description ?? null,
      price: modifier.price ?? null,
      externalID: modifier.id,
      isHidden: modifier.isHidden,
    };
    const modifierResponse: ModifierResponse = await ctx.modifierService.createModifier(modifierRequest, restaurantID, manager);
    const { modifierID } = modifierResponse;

    logger.debug(
      `LINKING CREATED MODIFIER { modifierID: ${modifierID}, externalID: ${externalModifierID} } TO MODIFIER GROUP { modifierGroupID: ${modifierGroupID}, externalID: ${groupExternalID} }`,
    );

    // link modifier to modifier service
    await ctx.modifierToModifierGroupLinkService.insertModifierToModifierGroupLinks(
      [{ modifierID: modifierID, modifierGroupID: modifierGroupID }],
      manager,
    );

    logger.info(
      `EXECUTION COMPLETE - ADD MODIFIER ${JSON.stringify(
        { ...modifierRequest, modifierID: modifierID, modifierGroupID: modifierGroupID },
        undefined,
        2,
      )}`,
    );
  }
}

export default AddModifierCommand;
