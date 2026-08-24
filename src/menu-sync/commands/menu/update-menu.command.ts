// {
//   "type": "UPDATE",
//   "key": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9",
//   "value": {
//     "name": "Testing Menu 2 Edited",
//     "description": "This is a test message"
//   },
//   "oldValue": {
//     "name": "Testing Menu 2",
//     "description": ""
//   },
//   "path": "$.$root[?(@.id=='ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9')].name",
//   "valueType": "Object",
//   "entity": "menu",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9",
//     "sectionId": null,
//     "itemId": null,
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": null,
//     "index": null
//   },
//   "keys": ["name","description"],
//   "id": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuEntity } from '@entities/menus.entity';
import {
  CreateMenuDisclaimersInterface,
  CreateMenuDisclaimersResponseInterface,
  EditMenuDisclaimersInterface,
} from '@interfaces/disclaimers.interface';
import { EditMenuRequestInterface } from '@interfaces/menus.interface';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class UpdateMenuCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.menuId;
    const keys: Set<string> = new Set(this.op.keys ?? []);
    const values: Partial<NormalizedMenu> = this.op.value;
    const oldValues: Partial<NormalizedMenu> = this.op.oldValue;

    logger.info(`EXECUTING COMMAND - UPDATE MENU { externalID: ${externalID} }`);

    const menu: MenuEntity = await ctx.menuService.getMenuByExternalID(externalID, manager);

    // if menu does not exist then throw error
    if (!menu) {
      throw new Error(`Menu { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_id, name, disclaimers } = menu;

    const buildEditDisclaimerRequest = (oldValue: string, newValue: string, disclaimerID: number | undefined): EditMenuDisclaimersInterface => {
      const insertDisclaimer: CreateMenuDisclaimersInterface[] = [];
      const deleteDisclaimer: number[] = [];
      const updateDisclaimer: CreateMenuDisclaimersResponseInterface[] = [];
      if (oldValue === '' && newValue?.length > 0) {
        // insert disclaimer
        insertDisclaimer.push({ message: newValue, position: 'menu top bar' });
      } else if (newValue === '' && oldValue?.length > 0) {
        deleteDisclaimer.push(disclaimerID);
      } else {
        updateDisclaimer.push({ messageID: disclaimerID, message: newValue, position: 'menu top bar' });
      }

      return {
        DELETE: deleteDisclaimer,
        INSERT: insertDisclaimer,
        UPDATE: updateDisclaimer,
      };
    };

    let editDisclaimerRequest: EditMenuDisclaimersInterface;
    if (keys.has('description')) {
      const existingDisclaimerID = disclaimers?.[0]?.message_id;
      editDisclaimerRequest = buildEditDisclaimerRequest(oldValues.description, values.description, existingDisclaimerID);
    } else {
      editDisclaimerRequest = {
        DELETE: [],
        INSERT: [],
        UPDATE: [],
      };
    }

    // Implementation requires entire menu edited everytime. This explains the implementation here.
    // Hope in the future to clean up that logic and only edit what is necessary.
    const editMenuRequest: EditMenuRequestInterface = {
      menuID: menu_id,
      name: keys.has('name') ? values.name : name,
      disclaimers: editDisclaimerRequest,
      isPrixFixe: false,
      menuHours: menu.hours?.map(hour => hour?.toMenuHours()),
    };

    await ctx.menuService.editMenu(editMenuRequest, manager);

    logger.info(`EXECUTION COMPLETE - UPDATE MENU ${JSON.stringify({ ...editMenuRequest, externalID: externalID }, undefined, 2)}`);
  }
}

export default UpdateMenuCommand;
