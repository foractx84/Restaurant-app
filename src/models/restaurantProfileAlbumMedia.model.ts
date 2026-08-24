import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { RestaurantProfileAlbumMediaModelInterface } from '@/interfaces/restaurantProfileAlbumMedia.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { getCurrentDate } from '@/utils/timeUtils';
import { classToPlain } from 'class-transformer';
import { EntityManager, In } from 'typeorm';

class RestaurantProfileAlbumMediaModel implements RestaurantProfileAlbumMediaModelInterface {
  deleteGalleryImagesByIDs = async (galleryImagesToDelete: number[], restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(
        RestaurantProfileAlbumMediaEntity,
        { restaurant_profile_album_media_id: In(galleryImagesToDelete) },
        { deleted_at: getCurrentDate() },
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while deleting gallery images to delete: ${JSON.stringify(
            galleryImagesToDelete,
          )} for restaurantID: ${restaurantID}. - ${err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting gallery images to delete: ${JSON.stringify(galleryImagesToDelete)} for restaurantID: ${restaurantID}`,
          ),
        );
      }
    }
  };

  insertRestaurantProfileAlbumMedia = async (
    restaurantProfileAlbumMediaEntities: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ): Promise<RestaurantProfileAlbumMediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = await repository.getCustomRepository(PostgresQueriesRepository);
      const restaurantProfileAlbumMediaResult = await customRepository.insert('restaurant_profile_album_media', restaurantProfileAlbumMediaEntities);
      return classToPlain(restaurantProfileAlbumMediaResult.raw) as RestaurantProfileAlbumMediaEntity[];
    } catch (err) {
      logger.error(`Error occurred when inserting restaurant profile album media ${JSON.stringify(restaurantProfileAlbumMediaEntities)}` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred when inserting restaurant profile album media ${JSON.stringify(
            restaurantProfileAlbumMediaEntities,
          )}. Refer to logs for more info.`,
        ),
      );
    }
  };

  reorderGalleryImages = async (restaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      if (restaurantProfileAlbumMedia?.length) {
        await repository.save(RestaurantProfileAlbumMediaEntity, restaurantProfileAlbumMedia);
      }
    } catch (err) {
      logger.error(`Error occurred while reordering gallery images in album. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while reordering gallery images in album. Refer to logs for more info.`),
      );
    }
  };
}

export default RestaurantProfileAlbumMediaModel;
