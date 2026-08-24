import { MenuItemVideoThumbnailEntity } from '@entities/menuItemVideoThumbnails.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuItemVideoThumbnailsDBInterface, MenuItemVideoThumbnailsModelInterface } from '@interfaces/menuItemVideoThumbnail.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getCurrentDate } from '@utils/timeUtils';
import { classToPlain } from 'class-transformer';
import { EntityManager } from 'typeorm';

class MenuItemVideoThumbnailsModel implements MenuItemVideoThumbnailsModelInterface {
  insertMenuItemVideoThumbnails = async (
    menuItemVideoThumbnails: MenuItemVideoThumbnailsDBInterface[],
    repository?: EntityManager,
  ): Promise<MenuItemVideoThumbnailEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const result = await customRepository.insert('menu_item_video_thumbnails', menuItemVideoThumbnails);
      return classToPlain(result.raw) as MenuItemVideoThumbnailEntity[];
    } catch (err) {
      logger.error(`Error occurred while inserting video thumbnails: ${menuItemVideoThumbnails}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting video thumbnails: ${menuItemVideoThumbnails}.  Refer to logs for more info.`,
        ),
      );
    }
  };

  softDeleteMenuItemVideoThumbnail = async (thumbnailID: number, repository?: EntityManager): Promise<MenuItemVideoThumbnailEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return (
        await repository
          .createQueryBuilder()
          .update(MenuItemVideoThumbnailEntity)
          .set({
            deleted_at: getCurrentDate(),
          })
          .where({ menu_item_video_thumbnail_id: thumbnailID })
          .returning('*')
          .execute()
      ).raw[0] as MenuItemVideoThumbnailEntity;
    } catch (err) {
      logger.error(`Error occurred in models query while soft deleting video thumbnailID ${thumbnailID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred in models query while soft deleting video thumbnailID ${thumbnailID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };
}

export default MenuItemVideoThumbnailsModel;
