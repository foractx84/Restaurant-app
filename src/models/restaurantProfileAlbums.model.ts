import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { RestaurantProfileAlbumsEntity } from '@entities/restaurantProfileAlbums.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@exceptions/HttpException';
import { RestaurantProfileAlbumsModelInterface } from '@interfaces/restaurantProfileAlbums.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { classToPlain } from 'class-transformer';
import { EntityManager } from 'typeorm';

class RestaurantProfileAlbumsModel implements RestaurantProfileAlbumsModelInterface {
  getRestaurantProfileAlbumsByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantProfileAlbumsEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository
        .getRepository(RestaurantProfileAlbumsEntity)
        .createQueryBuilder('album')
        .leftJoinAndSelect('album.restaurant_profile_album_media', 'media', 'media.deleted_at IS NULL')
        .where('album.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('album.deleted_at IS NULL')
        .orderBy('album.list_order', 'ASC')
        .getMany();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when fetching restaurant profile albums by restaurant id: ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.databaseError,
            `Error occurred when fetching restaurant profile albums by restaurant id: ${restaurantID}.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  insertRestaurantProfileAlbums = async (
    restaurantProfileAlbumsEntities: RestaurantProfileAlbumsEntity[],
    repository?: EntityManager,
  ): Promise<RestaurantProfileAlbumsEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = await repository.getCustomRepository(PostgresQueriesRepository);
      const restaurantProfileAlbumsResult = await customRepository.insert('restaurant_profile_albums', restaurantProfileAlbumsEntities);
      return classToPlain(restaurantProfileAlbumsResult.raw) as RestaurantProfileAlbumsEntity[];
    } catch (err) {
      logger.error(`Error occurred when inserting restaurant profile albums ${JSON.stringify(restaurantProfileAlbumsEntities)}` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred when inserting restaurant profile albums ${JSON.stringify(restaurantProfileAlbumsEntities)}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantProfileAlbumsModel;
