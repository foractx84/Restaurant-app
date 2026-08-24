import { MenuItemVideoThumbnailEntity } from '@/entities/menuItemVideoThumbnails.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  MenuItemVideoThumbnailsDBInterface,
  MenuItemVideoThumbnailsModelInterface,
  MenuItemVideoThumbnailsServiceInterface,
} from '@/interfaces/menuItemVideoThumbnail.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class MenuItemVideoThumbnailsService implements MenuItemVideoThumbnailsServiceInterface {
  private menuItemVideoThumbnailsModel: MenuItemVideoThumbnailsModelInterface;

  constructor(menuItemVideoThumbnailsModel: MenuItemVideoThumbnailsModelInterface) {
    this.menuItemVideoThumbnailsModel = menuItemVideoThumbnailsModel;
  }

  insertMenuItemVideoThumbnails = async (
    menuItemVideoThumbnails: MenuItemVideoThumbnailsDBInterface[],
    repository?: EntityManager,
  ): Promise<MenuItemVideoThumbnailEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.menuItemVideoThumbnailsModel.insertMenuItemVideoThumbnails(menuItemVideoThumbnails, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while inserting video thumbnails ${JSON.stringify(menuItemVideoThumbnails)} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting video thumbnails ${JSON.stringify(menuItemVideoThumbnails)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  softDeleteMenuItemVideoThumbnail = async (thumbnailID: number, repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.menuItemVideoThumbnailsModel.softDeleteMenuItemVideoThumbnail(thumbnailID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred in service logic while soft deleting video thumbnailID ${thumbnailID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred in service logic while soft deleting video thumbnailID ${thumbnailID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };
}

export default MenuItemVideoThumbnailsService;
