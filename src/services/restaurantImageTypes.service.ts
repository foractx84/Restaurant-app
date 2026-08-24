import { RestaurantImageTypeEntity } from '@/entities/restaurantImageType.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { RestaurantImageTypesModelInterface, RestaurantImageTypesServiceInterface } from '@/interfaces/restaurantImageTypes.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantImageTypesService implements RestaurantImageTypesServiceInterface {
  private restaurantImageTypesModel: RestaurantImageTypesModelInterface;

  constructor(restaurantImageTypesModel: RestaurantImageTypesModelInterface) {
    this.restaurantImageTypesModel = restaurantImageTypesModel;
  }

  getAllRestaurantImageTypes = async (repository?: EntityManager): Promise<RestaurantImageTypeEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.restaurantImageTypesModel.getAllRestaurantImageTypes();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting all restaurant image types - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting all restaurant image types. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };
}

export default RestaurantImageTypesService;
