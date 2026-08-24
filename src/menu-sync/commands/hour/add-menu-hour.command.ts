// {
//   "type": "ADD",
//   "key": "06:00-07:30",
//   "value": {
//     "startTime": "06:00",
//     "endTime": "07:30"
//   },
//   "path": "$.$root[?(@.id=='ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9')].hours.Sunday[?(@.compositeKey=='06:00-07:30')]",
//   "valueType": "Object",
//   "entity": "hours",
//   "context": {
//     "locationId": 225569,
//     "restaurantId": 1067,
//     "menuId": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9",
//     "sectionId": null,
//     "itemId": null,
//     "modifierGroupId": null,
//     "modifierId": null,
//     "day": "Sunday",
//     "index": null
//   },
//   "keys": [],
//   "id": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9"
// }

// {
//   "type": "ADD",
//   "key": "monday",
//   "value": [
//   {
//     "end_time": "04:30",
//     "start_time": "04:00"
//   },
//   {
//     "end_time": "05:30",
//     "start_time": "09:00"
//   }
// ],
//   "path": "$.$root[?(@.id=='30c622ec-78ab-5693-b2cf-c8fec391a284')].hours.monday",
//   "valueType": "Array"
// },
import { NormalizedMenuHour } from '@interfaces/platformIntegration.interface';
import { MenuHours } from '@interfaces/menuHours.interface';
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class AddMenuHourCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager: EntityManager) {
    const externalID: string = this.op.context.menuId;
    const day: string | null = this.op.context.day;
    const hours: NormalizedMenuHour[] = this.op.valueType === 'Array' ? this.op.value : [this.op.value];

    logger.info(`EXECUTING COMMAND - ADD HOURS FOR MENU { externalID: ${externalID} }`);

    // get menu by external id
    const menu = await ctx.menuService.getMenuByExternalID(externalID, manager);

    // if menu does not exist then throw error
    if (!menu) {
      throw new Error(`Menu { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    const { menu_id } = menu;

    const menuHours: MenuHours[] = hours.map(hour => ({
      day,
      start: hour.startTime,
      end: hour.endTime,
    }));

    logger.debug(`Inserting menu hour ${JSON.stringify(menuHours, undefined, 2)} for menu ${menu_id}`);

    await ctx.menuHoursService.createMenuHours(menuHours, menu_id, manager);

    logger.info(`EXECUTION COMPLETE - ADD HOURS FOR MENU { externalID: ${externalID}, menu_id: ${menu_id} }`);
  }
}

export default AddMenuHourCommand;
