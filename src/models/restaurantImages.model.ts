import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager, In } from 'typeorm';
import { RestaurantImagesModelInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantImageEntity } from '@entities/restaurantImage.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class RestaurantImagesModel implements RestaurantImagesModelInterface {
  findRestaurantImageEntitiesByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantImageEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return repository.find(RestaurantImageEntity, {
        where: { restaurant_id: restaurantID, deleted: false },
        relations: ['restaurant_image_type_id'],
      });
    } catch (e) {
      logger.error(`Error occurred while getting restaurant images by restaurantID: ${restaurantID} - ` + e);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant images by restaurantID: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  softDeleteRestaurantImages = async (imageIDs: number[], restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(RestaurantImageEntity, { restaurant_id: restaurantID, restaurant_image_id: In(imageIDs) }, { deleted: true });
    } catch (err) {
      logger.error(`Error occurred while deleting restaurant images: ${imageIDs} for restaurant: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting restaurant images: ${imageIDs} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertImages = async (restaurantImages: RestaurantImageEntity[], repository?: EntityManager): Promise<RestaurantImageEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const restaurantImageResult = await customRepository.insert('restaurant_images', restaurantImages);
      const images: RestaurantImageEntity[] = [];
      restaurantImageResult.raw.forEach(image => {
        images.push(classToPlain(image) as RestaurantImageEntity);
      });
      return images;
    } catch (err) {
      logger.error(
        `Error occurred while storing restaurant images ${JSON.stringify(restaurantImages)} for restaurant: ${
          restaurantImages[0]?.restaurant_id
        } - ` + err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while storing restaurant images ${JSON.stringify(restaurantImages)} for restaurant: ${
            restaurantImages[0]?.restaurant_id
          }. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantImagesModel;
