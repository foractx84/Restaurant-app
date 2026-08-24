import { RestaurantImageTypeEntity } from '@entities/restaurantImageType.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@exceptions/HttpException';
import { RestaurantImageTypesModelInterface } from '@interfaces/restaurantImageTypes.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantImageTypesModel implements RestaurantImageTypesModelInterface {
  getAllRestaurantImageTypes = async (repository?: EntityManager): Promise<RestaurantImageTypeEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(RestaurantImageTypeEntity);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting all restaurant image types - ` + err);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting all restaurant image types.`));
      }
    }
  };
}

export default RestaurantImageTypesModel;
