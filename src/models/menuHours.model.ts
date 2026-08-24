import { MenuHoursModelInterface, MenuHoursDBInterface } from '@interfaces/menuHours.interface';
import { HttpException, getErrorPayload, InternalErrorCode } from '@exceptions/HttpException';
import { EntityManager, In, InsertResult } from 'typeorm';
import { MenuHoursEntity } from '@entities/menuHours.entity';
import { logger } from '@utils/logger';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { ormConnection } from '@utils/dbUtils';

class MenuHoursModel implements MenuHoursModelInterface {
  insertAllMenuHours = async (menuHours: MenuHoursEntity[], repository: PostgresQueriesRepository): Promise<MenuHoursDBInterface[]> => {
    const menuHoursResults: InsertResult = await repository.insert('menu_hours', menuHours);
    return menuHoursResults.raw;
  };

  updateMenuHour = async (menuHour: Partial<MenuHoursEntity>, manager?: EntityManager): Promise<void> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      await manager.update<MenuHoursEntity>(MenuHoursEntity, { id: menuHour.id }, { start: menuHour.start, end: menuHour.end });
    } catch (err) {
      logger.error(`Error with updating menu hour with id '${menuHour.id}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with updating menu hour with id '${menuHour.id}. Refer to logs for more info.`),
      );
    }
  };

  getMenuHoursEntityByMenuID = async (menuID, repository?: EntityManager): Promise<MenuHoursEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find<MenuHoursEntity>(MenuHoursEntity, { menu_id: menuID });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while getting menu hours by menuID ${menuID}: - ` + err);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting menu hours menuID ${menuID}`));
      }
    }
  };

  hardDeleteMenuHoursByMenuID = async (menuID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.delete<MenuHoursEntity>(MenuHoursEntity, { menu_id: menuID });
    } catch (err) {
      logger.error(`Error with hard deleting menu hours for '${menuID}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with hard deleting menu hours '${menuID}`));
    }
  };

  hardDeleteMenuHoursByMenuHourIDs = async (hourIDs: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.delete(MenuHoursEntity, { id: In(hourIDs) });
    } catch (err) {
      logger.error(`Error with hard deleting menu hours with ids: '${hourIDs.toString()}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error with hard deleting menu hours with ids: '${hourIDs.toString()}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default MenuHoursModel;
