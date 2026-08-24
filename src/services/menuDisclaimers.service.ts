import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import {
  MenuDisclaimerModelInterface,
  MenuDisclaimerServiceInterface,
  MenuDisclaimerDBInterface,
  CreateMenuDisclaimersInterface,
  MenuDisclaimerInterface,
  EditMenuDisclaimersInterface,
  InsertedDisclaimersEditMenusInterface,
} from '@/interfaces/disclaimers.interface';
import { MenuDisclaimerEntity } from '@/entities/disclaimer.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import { MenuDisclaimer } from '@/enums/menuDisclaimer';
import { mapPositions } from '@/utils/util';

class MenuDisclaimersService implements MenuDisclaimerServiceInterface {
  private menuDisclaimersModel: MenuDisclaimerModelInterface;

  constructor(menuDisclaimersModel: MenuDisclaimerModelInterface) {
    this.menuDisclaimersModel = menuDisclaimersModel;
  }

  getAllMenuDisclaimersByMenuID = async (menuID: number, repository?: EntityManager): Promise<MenuDisclaimerInterface[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return this.buildMenuDisclaimersFromEntityArray(
        (await this.menuDisclaimersModel.getAllMenuDisclaimersEntityByMenuID(menuID, repository)) as MenuDisclaimerEntity[],
      ) as MenuDisclaimerInterface[];
    } catch (err) {
      logger.error(`Error occurred while getting menu disclaimers for menuID: ${menuID} - ` + err);
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting menu disclaimers for menuID: ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  editMenuDisclaimers = async (
    disclaimers: EditMenuDisclaimersInterface,
    menuID: number,
    repository?: EntityManager,
  ): Promise<InsertedDisclaimersEditMenusInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const { DELETE, UPDATE, INSERT } = disclaimers;

      // check if DELETE and UPDATE keys have same messageID, if so throw 400
      const messageIDsUPDATE = UPDATE?.map(disclaimer => disclaimer.messageID);
      this.checkDeleteAndUpdateHaveSameKey(DELETE, messageIDsUPDATE);

      // check if id(s) for DELETE and UPDATE exist in database
      const currentDisclaimers: MenuDisclaimerEntity[] = await this.menuDisclaimersModel.getAllMenuDisclaimersEntityByMenuID(menuID, repository);
      const currentIDs = currentDisclaimers.map(current => current.message_id);
      this.checkDeleteAndUpdateIdsAlreadyExist(currentIDs, [...DELETE, ...messageIDsUPDATE]);

      // check if INSERT is inserting into a disclaimer position that already exists for the menu
      // need to get current disclaimer positions for the menu
      // but also want to ignore disclaimers that will be deleted prior to insertion of new ones
      const insertPositions = this.checkInsertAlreadyIntoExistingPosition(currentDisclaimers, DELETE, INSERT);

      // check if UPDATE has a position that interferes with INSERT that has same position
      const updateDisclaimers = this.checkInsertAndUpdateHaveSamePosition(currentDisclaimers, currentIDs, insertPositions, UPDATE) || [];

      // DELETE disclaimers of a menu
      if (DELETE?.length > 0) {
        await this.deleteMenuDisclaimers(DELETE, menuID, repository);
      }

      // UPDATE menu disclaimers
      if (UPDATE?.length > 0) {
        await this.menuDisclaimersModel.updateMenuDisclaimers(updateDisclaimers, repository);
      }

      // INSERT menu disclaimers
      let returnedDisclaimers = [];
      if (INSERT?.length > 0) {
        returnedDisclaimers = this.buildMenuDisclaimersFromEntityArray(
          await this.insertMenuDisclaimers(INSERT, menuID, repository.getCustomRepository(PostgresQueriesRepository)),
        );
        returnedDisclaimers.map(disclaimer => {
          delete disclaimer?.menuID;
        });
      }
      return { insertedDisclaimers: returnedDisclaimers };
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while editing menu disclaimers for menu: ${menuID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing menu disclaimers for menu: ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  deleteMenuDisclaimers = async (disclaimerIDs: number[], menuID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.menuDisclaimersModel.deleteMenuDisclaimers(disclaimerIDs, menuID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while deleting menu disclaimers for disclaimerIDs: ${JSON.stringify(disclaimerIDs)} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting menu disclaimers for menu disclaimers for disclaimerIDs: ${JSON.stringify(
              disclaimerIDs,
            )}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  getMenuDisclaimerByIDAndMenuID = async (messageID: number, menuID: number, repository?: EntityManager): Promise<MenuDisclaimerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.menuDisclaimersModel.getMenuDisclaimerByIDAndMenuID(messageID, menuID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting menu disclaimer by messageID: ${messageID} and menuID ${menuID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting menu disclaimer by messageID: ${messageID} and menuID ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  insertMenuDisclaimers = async (
    menuDisclaimers: CreateMenuDisclaimersInterface[],
    menuID: number,
    repository: PostgresQueriesRepository,
  ): Promise<MenuDisclaimerDBInterface[]> => {
    try {
      const menuDisclaimersEntity: MenuDisclaimerEntity[] = [];

      await Promise.all(
        menuDisclaimers.map(async disclaimer => {
          const disclaimerEntity = new MenuDisclaimerEntity();
          disclaimerEntity.menu_id = menuID;
          disclaimerEntity.message = disclaimer.message;
          disclaimerEntity.message_type_id = (await this.menuDisclaimersModel.getMenuDisclaimerType(disclaimer.position)).message_type_id;
          menuDisclaimersEntity.push(disclaimerEntity);
        }),
      );
      return await this.menuDisclaimersModel.insertMenuDisclaimers(menuDisclaimersEntity, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while creating menu disclaimers for menu: ${menuID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.databaseError,
            `Error occurred while creating menu disclaimers for menu: ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  buildMenuDisclaimersFromEntityArray = (menuDisclaimersEntity: MenuDisclaimerEntity[]): MenuDisclaimerInterface[] => {
    const menuDisclaimerResponse: MenuDisclaimerInterface[] = [];
    const mapPosition = {
      [1]: MenuDisclaimer.top,
      [2]: MenuDisclaimer.bottom,
    };
    menuDisclaimersEntity.map(disclaimer =>
      menuDisclaimerResponse.push({
        message: disclaimer.message,
        messageID: disclaimer.message_id,
        position: mapPosition[disclaimer.message_type_id],
        menuID: disclaimer.menu_id,
      }),
    );
    return menuDisclaimerResponse;
  };

  checkDeleteAndUpdateHaveSameKey = (DELETE, messageIDsUPDATE) => {
    if (DELETE.some(id => messageIDsUPDATE.includes(id))) {
      logger.error(`Disclaimers have same id(s) for both UPDATING and DELETING.`);
      throw new HttpException(
        409,
        getErrorPayload(InternalErrorCode.resourceConflict, `Disclaimers have same id(s) for both UPDATING and DELETING.`),
      );
    }
  };

  checkDeleteAndUpdateIdsAlreadyExist = (currentIDs, deleteAndUpdateIds) => {
    for (const id of deleteAndUpdateIds) {
      if (!currentIDs.includes(id)) {
        logger.error(`Disclaimer id ${id} for either UPDATING and DELETING doesn't exist in database for menu.`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Disclaimer id ${id} for either UPDATING and DELETING doesn't exist in database for menu.`,
          ),
        );
      }
    }
  };

  checkInsertAlreadyIntoExistingPosition = (currentDisclaimers, DELETE, INSERT) => {
    const currentPositionsNotToBeDeleted = currentDisclaimers
      .map(current => {
        if (!DELETE.includes(current.message_id)) {
          return mapPositions[current.message_type_id];
        }
      })
      .filter(position => position != null);
    const insertPositions = INSERT.map(disclaimer => disclaimer.position) || [];
    if (insertPositions.some(position => currentPositionsNotToBeDeleted.includes(position))) {
      logger.error(`Disclaimers for INSERTING have a disclaimer position that already exists for this menu.`);
      throw new HttpException(
        409,
        getErrorPayload(
          InternalErrorCode.resourceConflict,
          `Disclaimers for INSERTING have a disclaimer position that already exists for this menu.`,
        ),
      );
    }
    return insertPositions;
  };

  checkInsertAndUpdateHaveSamePosition = (currentDisclaimers, currentIDs, insertPositions, UPDATE) => {
    const updateDisclaimers = [];
    for (const { messageID, message } of UPDATE) {
      const index = currentIDs.indexOf(messageID);
      if (index >= 0) {
        // id exists for UPDATE
        let position = '';
        for (const disclaimer of currentDisclaimers) {
          if (disclaimer?.message_id === messageID) {
            position = mapPositions[disclaimer?.message_type_id];
            if (!position) {
              logger.error(`message_type_id does not exist for menu disclaimer`);
              throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `message_type_id does not exist for menu disclaimer`));
            }
          }
        }

        // loop through INSERT
        for (const positionToInsert of insertPositions) {
          // UPDATE and INSERT have same position
          if (position === positionToInsert) {
            logger.error(`Disclaimers for INSERTING and UPDATING are modifying the same position of a menu disclaimer.`);
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `Disclaimers for INSERTING and UPDATING are modifying the same position of a menu disclaimer.`,
              ),
            );
          }
        }

        // build out array of UPDATE entities
        updateDisclaimers.push({
          message_id: messageID,
          message: message,
        });
      }
    }
    return updateDisclaimers;
  };
}

export default MenuDisclaimersService;
