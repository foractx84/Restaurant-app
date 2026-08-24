import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantGroupEntity } from '@entities/restaurantGroup.entity';

class RestaurantGroupsModel {
  getAllRestaurantGroups = async (repository?: EntityManager): Promise<RestaurantGroupEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.find(RestaurantGroupEntity, {
        order: {
          name: 'ASC',
        },
      });
    } catch (err) {
      logger.warn(`Error occurred while getting restaurant groups - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting restaurant groups. Refer to the logs for more detail.`),
      );
    }
  };

  getRestaurantGroupByID = async (restaurantGroupID: string, repository?: EntityManager): Promise<RestaurantGroupEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.findOne(RestaurantGroupEntity, {
        id: restaurantGroupID,
      });
    } catch (err) {
      logger.warn(`Error occurred while getting restaurant group by id: ${restaurantGroupID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant group by id: ${restaurantGroupID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  createRestaurantGroup = async (restaurantGroup: RestaurantGroupEntity, repository?: EntityManager): Promise<RestaurantGroupEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.save(RestaurantGroupEntity, restaurantGroup);
    } catch (err) {
      logger.warn(`Error occurred while creating restaurant group - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while creating restaurant group. Refer to the logs for more detail.`),
      );
    }
  };
}

export default RestaurantGroupsModel;
