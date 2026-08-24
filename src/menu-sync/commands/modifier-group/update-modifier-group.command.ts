// {
//   "type": "UPDATE",
//   "key": "60c33f25-5721-470e-bbe8-a35dbdb12463",
//   "value": {
//     "name": "Test Group Edit"
//   },
//   "oldValue": {
//     "name": "Test Group"
//   },
//   "path": "$.$root[?(@.id=='4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a')].sections[?(@.id=='7edb30b4-165a-4d04-aecb-9a6641b8f79e')].items[?(@.id=='97e2493f-9eab-4fba-8b08-4ad63c0a98c0')].modifierGroups[?(@.id=='60c33f25-5721-470e-bbe8-a35dbdb12463')].name",
//   "valueType": "Object",
//   "entity": "modifierGroup",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "4bfdfb8a-71ef-5b71-9eba-7ca99fedf18a",
//     "sectionId": "7edb30b4-165a-4d04-aecb-9a6641b8f79e",
//     "itemId": "97e2493f-9eab-4fba-8b08-4ad63c0a98c0",
//     "modifierGroupId": "60c33f25-5721-470e-bbe8-a35dbdb12463",
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": ["name"],
//   "id": "60c33f25-5721-470e-bbe8-a35dbdb12463"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';
import { EditModifierGroupRequestInterface } from '@interfaces/modifierGroup.interface';
import { NormalizedModifierGroup } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class UpdateModifierGroupCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.modifierGroupId;
    const values: Partial<NormalizedModifierGroup> = this.op.value;
    const keys: Set<string> = new Set(this.op.keys ?? []);

    logger.info(`EXECUTING COMMAND - UPDATE MODIFIER GROUP { externalID: ${externalID} }`);

    // get modifier group by external id
    const modifierGroup: ModifierGroupEntity = await ctx.modifierGroupService.getModifierGroupByExternalID(externalID, manager);

    // if modifier group does not exist then throw error
    if (!modifierGroup) {
      throw new Error(`Modifier Group { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { modifierGroupID, name } = modifierGroup;

    logger.debug(`UPDATING MODIFIER GROUP { externalID: ${externalID}: modifierGroupID: ${modifierGroupID} }`);

    const updatedName = keys.has('name') ? values.name : name;
    const request: EditModifierGroupRequestInterface = {
      modifierGroupID: modifierGroupID,
      name: updatedName,
      label: updatedName,
      // `undefined` when the diff has no key for a field — the entity's `updateModifierGroup` treats
      // `undefined` as "leave alone." A key that IS present but has value `null` means the source
      // platform explicitly cleared a previously-set constraint, and must flow through as `null`
      // (not collapse to "no change") so the DB column actually gets cleared.
      minimumSelections: keys.has('minimumSelections') ? values.minimumSelections ?? null : undefined,
      maximumSelections: keys.has('maximumSelections') ? values.maximumSelections ?? null : undefined,
      maxPerModifierSelectionQuantity: keys.has('maxPerModifierSelectionQuantity') ? values.maxPerModifierSelectionQuantity ?? null : undefined,
    };

    await ctx.modifierGroupService.editModifierGroup(request, modifierGroup, true, manager);

    logger.info(`EXECUTION COMPLETE - UPDATE MODIFIER GROUP ${JSON.stringify({ ...request, externalID: externalID }, undefined, 2)}`);
  }
}

export default UpdateModifierGroupCommand;
