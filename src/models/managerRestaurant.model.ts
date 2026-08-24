import { ManagerRestaurantsEntity } from '@entities/managerRestaurants.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ManagerRestaurantModelInterface } from '@interfaces/managerRestaurant.interface';

class ManagerRestaurantModel implements ManagerRestaurantModelInterface {
  insertManagerRestaurantEntity = async (managerID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.insert(ManagerRestaurantsEntity, { external_user_id: managerID, restaurant_id: restaurantID });
    } catch (err) {
      logger.error(`Error occurred while inserting managerID ${managerID} with restaurantID ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting managerID ${managerID} with restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ManagerRestaurantModel;
