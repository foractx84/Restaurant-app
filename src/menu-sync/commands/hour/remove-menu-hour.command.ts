// {
//   "type": "REMOVE",
//   "key": "09:00-20:30",
//   "value": {
//     "endTime": "20:30",
//     "startTime": "09:00"
//   },
//   "path": "$.$root[?(@.id=='ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9')].hours.Tuesday[?(@.compositeKey=='09:00-20:30')]",
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
//     "day": "Tuesday",
//     "index": null
//   },
//   "keys": [],
//   "id": "ef9beb1f-d52c-4d4f-9bc8-8686a5cde0f9"
// }
import { MenuCommand } from '@menu-sync/commands/base.command';
import { EnrichedOperation, MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import { logger } from '@utils/logger';
import { MenuEntity } from '@entities/menus.entity';
import { MenuHoursEntity } from '@entities/menuHours.entity';
import { NormalizedMenuHour } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

class RemoveMenuHourCommand implements MenuCommand {
  constructor(private op: EnrichedOperation) {}

  async execute(ctx: MenuUpdateContext, manager?: EntityManager) {
    const menuID: string = this.op.context.menuId;
    const day: string | null = this.op.context.day;

    // get menu by external id
    const menu: MenuEntity = await ctx.menuService.getMenuByExternalID(menuID, manager);

    // if menu does not exist then throw error
    if (!menu) {
      throw new Error(`Menu { externalID: ${menuID} } does not exist. Will need to look into this issue if prevalent.`);
    }

    logger.info(`EXECUTING COMMAND - REMOVE MENU HOURS { day: ${day} } FOR MENU { externalID: ${menuID}, menuID: ${menu.menu_id} }`);

    const normalizedHours: NormalizedMenuHour[] = Array.isArray(this.op.value) ? this.op.value : [this.op.value];
    const hours: MenuHoursEntity[] = menu.hours.filter(hour => hour.day.toLowerCase() === day.toLowerCase());
    const hourIDs: number[] = [];

    for (const normalized of normalizedHours) {
      logger.debug(`REMOVING MENU HOUR - day="${day}" startTime="${normalized.startTime}" endTime="${normalized.endTime}"`);

      const remove: MenuHoursEntity = hours.find(hour => hour.start === normalized.startTime && hour.end === normalized.endTime);

      logger.debug(`MENU HOUR TO REMOVE -  ${JSON.stringify(remove, undefined, 2)}`);

      // if hour has been removed already then throw error
      if (!remove) {
        throw new Error(`Menu Hour ${JSON.stringify(normalized)} not found. Will need to look into this issue if prevalent.`);
      }

      hourIDs.push(remove.id);
    }

    if (hourIDs.length > 0) {
      logger.debug(`REMOVING MENU HOURS { externalID: ${menuID}, ids: ${JSON.stringify(hourIDs)} }`);
      await ctx.menuHoursService.hardDeleteMenuHoursByMenuHourIDs(hourIDs, manager);
    }

    logger.info(`EXECUTION COMPLETE - REMOVE MENU HOURS FROM MENU { externalID: ${menuID}, menu_id: ${menu.menu_id} }`);
  }
}

export default RemoveMenuHourCommand;
