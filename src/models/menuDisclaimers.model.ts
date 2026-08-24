import { InsertResult } from 'typeorm';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { ormConnection } from '@utils/dbUtils';
import { MenuDisclaimerEntity } from '@entities/disclaimer.entity';
import { MenuDisclaimerTypeEntity } from '@entities/disclaimerType.entity';
import { InternalErrorCode, HttpException, getErrorPayload } from '@exceptions/HttpException';
import { MenuDisclaimerModelInterface, MenuDisclaimerDBInterface } from '@interfaces/disclaimers.interface';
import { EntityManager, In } from 'typeorm';
import { logger } from '@utils/logger';
import { classToPlain } from 'class-transformer';
import { MenuDisclaimer } from '@enums/menuDisclaimer';

class MenuDisclaimerModel implements MenuDisclaimerModelInterface {
  getAllMenuDisclaimersEntityByMenuID = async (menuID: number, repository: EntityManager): Promise<MenuDisclaimerEntity[]> => {
    try {
      return await repository.find(MenuDisclaimerEntity, { menu_id: menuID });
    } catch (err) {
      logger.error(`Error getting menu disclaimers with menuID ${menuID} -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error getting menu disclaimers with menuID ${menuID}`));
    }
  };

  getMenuDisclaimerByIDAndMenuID = async (messageID: number, menuID: number): Promise<MenuDisclaimerEntity> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      return await ormConn.findOne(MenuDisclaimerEntity, { message_id: messageID, menu_id: menuID });
    } catch (err) {
      logger.error(`Error getting menu disclaimers with messageID ${messageID} and menuID ${menuID} -` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error getting menu disclaimers with messageID ${messageID} and menuID ${menuID} -`),
      );
    }
  };

  getMenuDisclaimerType = async (position: MenuDisclaimer): Promise<MenuDisclaimerTypeEntity> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      return await ormConn.findOne(MenuDisclaimerTypeEntity, { name: position });
    } catch (err) {
      logger.error(`Error getting menu disclaimers with name '${position}' -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error selecting menu disclaiemrs '${position}'`));
    }
  };

  insertMenuDisclaimers = async (
    menuDisclaimersEntityArray: MenuDisclaimerEntity[],
    repository: PostgresQueriesRepository,
  ): Promise<MenuDisclaimerDBInterface[]> => {
    const menuDisclaimersResults: InsertResult = await repository.insert('menu_messages', menuDisclaimersEntityArray);
    const menuDisclaimers = classToPlain(menuDisclaimersResults.raw);
    return menuDisclaimers as MenuDisclaimerDBInterface[];
  };

  deleteMenuDisclaimers = async (disclaimersToDelete: number[], menuID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.delete(MenuDisclaimerEntity, { message_id: In(disclaimersToDelete), menu_id: menuID });
    } catch (err) {
      logger.error(
        `Error deleting menu disclaimers with messageID '${JSON.stringify(
          disclaimersToDelete.map(id => {
            return id;
          }),
        )}' -` + err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error deleting menu disclaimers with messageID '${JSON.stringify(
            disclaimersToDelete.map(id => {
              return id;
            }),
          )}'`,
        ),
      );
    }
  };

  updateMenuDisclaimers = async (menuDisclaimers: MenuDisclaimerEntity[], repository: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(MenuDisclaimerEntity, menuDisclaimers);
    } catch (err) {
      logger.error(`Error updating menu disclaimers '${JSON.stringify(menuDisclaimers)}' -` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error updating menu disclaimers '${JSON.stringify(menuDisclaimers)}`),
      );
    }
  };
}

export default MenuDisclaimerModel;
