import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { RestaurantAddressEntity } from '@entities/restaurantAddress.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantAddressModelInterface } from '@interfaces/restaurantAddress.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { classToPlain } from 'class-transformer';
import { EntityManager } from 'typeorm';

class RestaurantAddressModel implements RestaurantAddressModelInterface {
  fetchRestaurantAddressByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantAddressEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.findOne(RestaurantAddressEntity, { restaurant_id: restaurantID });
    } catch (err) {
      logger.error(`Error occurred while fetching restaurant address for restaurant: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurant address for restaurant: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
  fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID = async (
    restaurantAddressID: number,
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<RestaurantAddressEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.findOne(RestaurantAddressEntity, { restaurant_id: restaurantID, restaurant_address_id: restaurantAddressID });
    } catch (err) {
      logger.error(`Error occurred while fetching restaurant address: ${restaurantAddressID} for restaurant: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurant address: ${restaurantAddressID} for restaurant: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
  insertRestaurantAddressEntity = async (address: RestaurantAddressEntity, repository?: EntityManager): Promise<RestaurantAddressEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const restaurantResult = await customRepository.insert('restaurant_addresses', [address]);
      const databaseResult = classToPlain(restaurantResult.raw[0]);
      return databaseResult as RestaurantAddressEntity;
    } catch (err) {
      logger.error(`Error occurred while inserting restaurant address ${JSON.stringify(address)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting restaurant address ${JSON.stringify(address)}. Refer to logs for more info.`,
        ),
      );
    }
  };
  updateRestaurantAddressEntity = async (
    address: RestaurantAddressEntity,
    restaurantAddressID: number,
    repository?: EntityManager,
  ): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(RestaurantAddressEntity, restaurantAddressID, address);
    } catch (err) {
      logger.error(`Error occurred while updating restaurant address: ${restaurantAddressID} - ${JSON.stringify(address)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating restaurant address: ${restaurantAddressID} - ${JSON.stringify(address)}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantAddressModel;
