import { RestaurantPackageEntity } from '@/entities/restaurantPackage.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { RestaurantPackageModelInterface, RestaurantPackageServiceInterface } from '@/interfaces/restaurantPackage.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantPackageService implements RestaurantPackageServiceInterface {
  private restaurantPackageModel: RestaurantPackageModelInterface;

  constructor(restaurantPackageModel: RestaurantPackageModelInterface) {
    this.restaurantPackageModel = restaurantPackageModel;
  }

  checkRestaurantAlreadyHasPackage = async (packageID: number, restaurantID: number): Promise<void> => {
    try {
      const restaurantPackage: RestaurantPackageEntity = await this.restaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID(
        packageID,
        restaurantID,
      );
      if (restaurantPackage) {
        logger.error(`restaurantID ${restaurantID} already has packageID ${packageID}.`);
        throw new HttpException(
          409,
          getErrorPayload(InternalErrorCode.resourceConflict, `restaurantID ${restaurantID} already has a packageID ${packageID}.`),
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when checking if restaurantID ${restaurantID} already has a package. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when checking if restaurantID ${restaurantID} already has a package. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createRestaurantPackage = async (packageID: number, restaurantID: number): Promise<RestaurantPackageEntity> => {
    try {
      return await this.restaurantPackageModel.insertRestaurantPackageEntity(this.buildRestaurantPackageEntity(packageID, restaurantID));
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating packageID ${packageID} with restaurantID ${restaurantID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating packageID ${packageID} with restaurantID ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  deactivateRestaurantPackage = async (restaurantPackageID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantPackageModel.deactivateRestaurantPackage(restaurantPackageID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while deactivating restaurant package by ${restaurantPackageID}. - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deactivating restaurant package by ${restaurantPackageID}.. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  buildRestaurantPackageEntity = (packageID: number, restaurantID: number): RestaurantPackageEntity => ({
    package_id: packageID,
    restaurant_id: restaurantID,
  });
}

export default RestaurantPackageService;
