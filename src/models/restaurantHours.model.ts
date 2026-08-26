import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { RestaurantHoursEntity } from '@entities/restaurantHours.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantHoursDBInterface, RestaurantHoursModelInterface } from '@interfaces/restaurantHours.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { classToPlain } from 'class-transformer';
import { EntityManager } from 'typeorm';

class RestaurantHoursModel implements RestaurantHoursModelInterface {
  deleteRestaurantHours = async (restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.delete(RestaurantHoursEntity, { restaurant_id: restaurantID });
    } catch (err) {
      logger.error(`Error occurred while deleting restaurant hours for restaurantID ${JSON.stringify(restaurantID)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting restaurant hours for restaurantID ${JSON.stringify(restaurantID)}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getRestaurantHoursByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantHoursEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(RestaurantHoursEntity, { where: { restaurant_id: restaurantID } });
    } catch (err) {
      logger.error(`Error occurred while fetching restaurant hours for restaurantID ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurant hours for restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertRestaurantHours = async (restaurantHours: RestaurantHoursDBInterface[], repository?: EntityManager): Promise<RestaurantHoursEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = await repository.getCustomRepository(PostgresQueriesRepository);
      const restaurantHoursResult = await customRepository.insert('restaurant_hours', restaurantHours);
      return classToPlain(restaurantHoursResult.raw) as RestaurantHoursEntity[];
    } catch (err) {
      logger.error(`Error occurred while saving restaurant hours for restaurant ${JSON.stringify(restaurantHours)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while saving restaurant hours for restaurant ${JSON.stringify(restaurantHours)}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantHoursModel;
