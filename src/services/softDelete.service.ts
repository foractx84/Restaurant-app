import { SoftDeleteServiceInterface, SoftDeleteModelInterface } from '@interfaces/softDelete.interface';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';

class SoftDeleteService implements SoftDeleteServiceInterface {
  private softDeleteModel: SoftDeleteModelInterface;

  constructor(softDeleteModel: SoftDeleteModelInterface) {
    this.softDeleteModel = softDeleteModel;
  }

  softDeleteMenuByID = async (menuID: number): Promise<void> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.softDeleteModel.softDeleteMenuByID(menuID, conn);
        await this.softDeleteMenuSectionByMenuID(menuID, conn);
        await this.softDeleteMenuItemByMenuID(menuID, conn);
      });
    } catch (err) {
      logger.warn(`Error soft deleting menu with menuID: ${menuID}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error soft deleting menu with menuID '${menuID}'`));
    }
  };

  softDeleteMenuItemByMenuID = async (menuID: number, repository: EntityManager): Promise<void> => {
    await this.softDeleteModel.softDeleteMenuItemByMenuID(menuID, repository);
  };

  softDeleteMenuItemByMenuSectionID = async (menuSectionID: number, repository: EntityManager): Promise<void> => {
    await this.softDeleteModel.softDeleteMenuItemByMenuSectionID(menuSectionID, repository);
  };

  softDeleteMenuSectionByID = async (menuSectionID: number): Promise<void> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.softDeleteModel.softDeleteMenuSectionByID(menuSectionID, conn);
        await this.softDeleteMenuItemByMenuSectionID(menuSectionID, conn);
      });
    } catch (err) {
      logger.warn(`Error soft deleting menu section with menuSectionID: ${menuSectionID}` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error soft deleting menu section with menuSectionID '${menuSectionID}'`),
      );
    }
  };

  softDeleteMenuSectionByMenuID = async (menuID: number, repository: EntityManager): Promise<void> => {
    await this.softDeleteModel.softDeleteMenuSectionByMenuID(menuID, repository);
  };
}

export default SoftDeleteService;
