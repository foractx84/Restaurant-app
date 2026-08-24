import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { RestaurantGroupEntity } from '@entities/restaurantGroup.entity';
import RestaurantGroupsModel from '@models/restaurantGroups.model';

class RestaurantGroupsService {
  private restaurantGroupsModel: RestaurantGroupsModel;

  constructor(restaurantGroupsModel: RestaurantGroupsModel) {
    this.restaurantGroupsModel = restaurantGroupsModel;
  }

  getAllRestaurantGroups = async (): Promise<RestaurantGroupEntity[]> => {
    try {
      return await this.restaurantGroupsModel.getAllRestaurantGroups();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while getting restaurant groups - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting restaurant groups. Refer to the logs for more detail.`),
      );
    }
  };

  getRestaurantGroupByID = async (restaurantGroupID: string): Promise<RestaurantGroupEntity> => {
    try {
      const restaurantGroup = await this.restaurantGroupsModel.getRestaurantGroupByID(restaurantGroupID);

      if (!restaurantGroup) {
        logger.error(`Restaurant group ${restaurantGroupID} does not exist.`);

        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant group ${restaurantGroupID} does not exist.`));
      }

      return restaurantGroup;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while getting restaurant group by id ${restaurantGroupID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while getting restaurant group by id: ${restaurantGroupID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  createRestaurantGroup = async (name: string): Promise<RestaurantGroupEntity> => {
    try {
      const restaurantGroup = new RestaurantGroupEntity(name);

      return await this.restaurantGroupsModel.createRestaurantGroup(restaurantGroup);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while creating restaurant group - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating restaurant group. Refer to the logs for more detail.`),
      );
    }
  };
}

export default RestaurantGroupsService;
