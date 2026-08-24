import { MediaEntity } from '@/entities/media.entity';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { MenuItemMediaEntity } from '@entities/menuItemMedia.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuItemMediaDBInterface, MenuItemMediaModelInterface } from '@interfaces/menuItemMedia.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getCurrentDate } from '@utils/timeUtils';
import { classToPlain } from 'class-transformer';
import { EntityManager, In, IsNull } from 'typeorm';

class MenuItemMediaModel implements MenuItemMediaModelInterface {
  deleteMenuItemMedia = async (imagesToDelete: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(MenuItemMediaEntity, { menu_item_media_id: In(imagesToDelete) }, { deleted_at: getCurrentDate() });
    } catch (err) {
      logger.error(`Error while deleting multiple menu item images. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while deleting multiple menu item images. Refer to logs for more detail.`),
      );
    }
  };

  getMenuItemMediaByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<MenuItemMediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const query = repository
        .getRepository(MenuItemMediaEntity)
        .createQueryBuilder('menu_item_media')
        .leftJoinAndSelect('menu_item_media.menu_item_media_type_id', 'media_type')
        .leftJoinAndSelect('menu_item_media.menu_item_video_thumbnails', 'video_thumbnail')
        .where('menu_item_media.menu_item_id = :menuItemID', { menuItemID })
        .andWhere('menu_item_media.deleted_at IS NULL')
        .andWhere('video_thumbnails.deleted_at IS NULL');

      return await query.getMany();
    } catch (err) {
      logger.error(`Error while getting menu item media with menuItemID: ${menuItemID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while getting menu item media with menuItemID: ${menuItemID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertMenuItemMedia = async (
    menuItemMedia: MenuItemMediaDBInterface[] | MenuItemMediaEntity[],
    repository?: EntityManager,
  ): Promise<MenuItemMediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const result = await customRepository.insert('menu_item_media', menuItemMedia);
      return classToPlain(result.raw) as MenuItemMediaEntity[];
    } catch (err) {
      logger.error(`Error occurred while inserting menuItemMedia for menuItemID: ${menuItemMedia[0].menu_item_id}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting menuItemMedia for menuItemID: ${menuItemMedia[0].menu_item_id}. Refer to logs for more info.`,
        ),
      );
    }
  };

  reorderMenuItemMediaImages = async (updatedListOrder: MenuItemMediaDBInterface[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(MenuItemMediaEntity, updatedListOrder);
    } catch (err) {
      logger.error(`Error occurred while reordering menuItemMediaImages list order. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while reordering menuItemMediaImages list order. Refer to logs for more info.`,
        ),
      );
    }
  };

  // in hindsight could just call deleteMenuItemMedia instead, although this has better error messaging
  softDeleteMenuItemMediaByIDs = async (mediaIDs: number[], menuItemID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(MenuItemMediaEntity, { menu_item_id: menuItemID, menu_item_media_id: In(mediaIDs) }, { deleted_at: getCurrentDate() });
    } catch (err) {
      logger.error(`Error occurred while soft deleting menu item media by ids: ${mediaIDs} for menuItemID: ${menuItemID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while soft deleting menu item media by ids: ${mediaIDs} for menuItemID: ${menuItemID}.  Refer to logs for more detail.`,
        ),
      );
    }
  };

  // temp for deprecated image_url of menu_item table
  updateImageUrlForMenuItem = async (menuItemID: number, repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const menuItemMediaImages = await repository.find(MenuItemMediaEntity, {
        where: {
          menu_item_id: menuItemID,
          menu_item_media_type_id: 1,
          deleted_at: IsNull(),
        },
        order: {
          list_order: 'ASC',
        },
      });
      if (menuItemMediaImages?.length) {
        // set image_url of menu_items table to media_url of menu_item_media table where list_order = 0
        await repository.update(MenuItemEntity, menuItemID, { image_url: menuItemMediaImages[0].media_url });
      } else {
        // no images exist for menu item, set to null
        await repository.update(MenuItemEntity, menuItemID, { image_url: null });
      }
    } catch (err) {
      logger.error(`Error occurred while updating image_url into menu_items for menuItemID ${menuItemID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating image_url into menu_items for menuItemID ${menuItemID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default MenuItemMediaModel;
