import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuHours, MenuHoursDBInterface, MenuHoursModelInterface, MenuHoursServiceInterface } from '@interfaces/menuHours.interface';
import { MenuHoursEntity } from '@/entities/menuHours.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';

class MenuHoursService implements MenuHoursServiceInterface {
  private menuHoursModel: MenuHoursModelInterface;

  constructor(menuHoursModel: MenuHoursModelInterface) {
    this.menuHoursModel = menuHoursModel;
  }

  createMenuHours = async (menuHours: MenuHours[], menuID: number, manager?: EntityManager): Promise<MenuHoursDBInterface[]> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      const repository: PostgresQueriesRepository = await manager.getCustomRepository(PostgresQueriesRepository);
      return await this.insertMenuHours(menuHours, menuID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating menu hours for menu: ${menuID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.databaseError,
            `Error occurred while creating menu hours for menu: ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  insertMenuHours = async (menuHours: MenuHours[], menuID: number, repository?: PostgresQueriesRepository): Promise<MenuHoursDBInterface[]> => {
    try {
      if (!repository) {
        const entityManager: EntityManager = await ormConnection();
        repository = entityManager.getCustomRepository(PostgresQueriesRepository);
      }

      const menuHoursEntities: MenuHoursEntity[] = [];
      menuHours.map(specific_day => {
        const menuHoursEntity = new MenuHoursEntity(menuID, specific_day.day, specific_day.start, specific_day.end);
        menuHoursEntities.push(menuHoursEntity);
      });
      return await this.menuHoursModel.insertAllMenuHours(menuHoursEntities, repository);
    } catch (err) {
      logger.error(`Error occurred while creating menu hours for menu: ${menuID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while creating menu hours for menu: ${menuID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  updateMenuHour = async (menuHour: Partial<MenuHoursEntity>, manager?: EntityManager) => {
    try {
      await this.menuHoursModel.updateMenuHour(menuHour, manager);
    } catch (err) {
      logger.error(`Error occurred while updating menu hours for menu: ${menuHour.menu_id}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating menu hours for menu: ${menuHour.menu_id}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getMenuHoursByMenuID = async (menuID, repository?: EntityManager): Promise<MenuHours[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return this.buildMenuHoursResponse(await this.menuHoursModel.getMenuHoursEntityByMenuID(menuID, repository));
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting menu hours by menuID ${menuID} - ` + err);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting menu hours by menuID ${menuID}`));
      }
    }
  };

  buildMenuHoursResponse = (menuHoursEntity: MenuHoursEntity[]): MenuHours[] => {
    const menuHours = [];
    for (const day of menuHoursEntity) {
      menuHours.push({
        day: day.day,
        start: day.start,
        end: day.end,
      });
    }
    return menuHours;
  };

  hardDeleteMenuHoursByMenuHourIDs = async (hourIDs: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.menuHoursModel.hardDeleteMenuHoursByMenuHourIDs(hourIDs, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while hard deleting menu hours by hour ids: ${hourIDs.toString()}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while hard deleting menu hours by hour ids: ${hourIDs.toString()}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  hardDeleteMenuHoursByMenuID = async (menuID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.menuHoursModel.hardDeleteMenuHoursByMenuID(menuID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of (i.e came from hardDeleteMenuHoursByMenuID models function)
        throw err;
      } else {
        logger.error(`Error occurred while hard deleting menu hours for menu: ${menuID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while hard deleting menu hours for menu: ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };
}

export default MenuHoursService;
