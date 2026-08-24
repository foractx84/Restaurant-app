import { MenuLayoutModelInterface } from '@interfaces/menuLayout.interface';
import { HttpException, getErrorPayload, InternalErrorCode } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { RestaurantMenuLayoutEntity } from '@entities/restaurantMenuLayout.entity';
import { MenuLayoutEntity } from '@entities/menuLayout.entity';

class MenuLayoutsModel implements MenuLayoutModelInterface {
  getAllMenuLayouts = async (repository?: EntityManager): Promise<MenuLayoutEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(MenuLayoutEntity);
    } catch (err) {
      logger.warn(`Error occurred while getting all menu layouts - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting all menu layouts. Refer to the logs for more detail.`),
      );
    }
  };

  getMenuLayoutByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantMenuLayoutEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(RestaurantMenuLayoutEntity, { restaurant_id: restaurantID });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while getting menu layout by restaurantID ${restaurantID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting menu layout by restaurantID ${restaurantID}`),
        );
      }
    }
  };

  updateMenuLayoutOfRestaurant = async (layoutID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(RestaurantMenuLayoutEntity, { restaurant_id: restaurantID }, { menu_layout_id: layoutID });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while updating menu layout id ${layoutID} for a restaurantID ${restaurantID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while updating menu layout id ${layoutID} for a restaurantID ${restaurantID}`,
          ),
        );
      }
    }
  };
}

export default MenuLayoutsModel;
