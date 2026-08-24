import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { ManagerRestaurantModelInterface, ManagerRestaurantServiceInterface } from '@/interfaces/managerRestaurant.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class ManagerRestaurantService implements ManagerRestaurantServiceInterface {
  private managerRestaurantModel: ManagerRestaurantModelInterface;

  constructor(managerRestaurantModel: ManagerRestaurantModelInterface) {
    this.managerRestaurantModel = managerRestaurantModel;
  }

  insertManagerRestaurantEntity = async (managerID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.managerRestaurantModel.insertManagerRestaurantEntity(managerID, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while inserting manager ${managerID} tied to restaurant: ${restaurantID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting manager ${managerID} tied to restaurant: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default ManagerRestaurantService;
