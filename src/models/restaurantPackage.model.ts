import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { RestaurantPackageEntity } from '@entities/restaurantPackage.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantPackageModelInterface } from '@interfaces/restaurantPackage.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { classToPlain } from 'class-transformer';
import { EntityManager, IsNull } from 'typeorm';

class RestaurantPackageModel implements RestaurantPackageModelInterface {
  deactivateRestaurantPackage = async (restaurantPackageID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository
        .createQueryBuilder()
        .update(RestaurantPackageEntity)
        .set({ is_active: false })
        .where({ restaurant_package_id: restaurantPackageID })
        .execute();
    } catch (err) {
      logger.error(`Error occurred while deactivating restaurant package by restaurantPackageID ${restaurantPackageID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deactivating restaurant package by restaurantPackageID ${restaurantPackageID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getRestaurantPackageByPackageIDAndRestaurantID = async (
    packageID: number,
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<RestaurantPackageEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(RestaurantPackageEntity, { package_id: packageID, restaurant_id: restaurantID, deleted_at: IsNull() });
    } catch (err) {
      logger.error(`Error occurred while getting restaurant package by restaurantID ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant package by restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertRestaurantPackageEntity = async (
    restaurantPackageEntity: RestaurantPackageEntity,
    repository?: EntityManager,
  ): Promise<RestaurantPackageEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const restaurantResult = await customRepository.insert('restaurant_packages', [restaurantPackageEntity]);
      const databaseResult = classToPlain(restaurantResult.raw[0]);
      return databaseResult as RestaurantPackageEntity;
    } catch (err) {
      logger.error(
        `Error occurred while inserting restaurant package by packageID ${restaurantPackageEntity.package_id} and restaurantID ${restaurantPackageEntity.restaurant_id} - ` +
          err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting restaurant package by packageID ${restaurantPackageEntity.package_id} and restaurantID ${restaurantPackageEntity.restaurant_id}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantPackageModel;
