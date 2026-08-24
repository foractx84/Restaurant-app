import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { DrinkItemModelInterface, DrinkItemServiceInterface, GetDrinkItemsInterface } from '@interfaces/drinkItem.interface';

class DrinkItemService implements DrinkItemServiceInterface {
  private drinkItemModel: DrinkItemModelInterface;

  constructor(drinkItemModel: DrinkItemModelInterface) {
    this.drinkItemModel = drinkItemModel;
  }

  getDrinkItemsByIDsAndRestaurantID = async (drinkItemIDs: number[], restaurantID: number): Promise<MenuItemEntity[]> => {
    try {
      return await this.drinkItemModel.getDrinkItemsByIDsAndRestaurantID(drinkItemIDs, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error fetching drinks items: ${drinkItemIDs.toString()} by restaurant: ${restaurantID}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error fetching drinks items: ${drinkItemIDs.toString()} by restaurant: ${restaurantID} - ${err}`,
          ),
        );
      }
    }
  };

  getDrinkItemsByRestaurantID = async (restaurantID: number): Promise<GetDrinkItemsInterface[]> => {
    try {
      const drinkItems: MenuItemEntity[] = await this.drinkItemModel.getDrinkItemsByRestaurantID(restaurantID);

      return drinkItems.map(drinkItem => ({
        name: drinkItem.name,
        drinkItemID: drinkItem.menu_item_id,
        isHidden: drinkItem.is_hidden,
      })) as GetDrinkItemsInterface[];
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error getting drinks items by restaurant: ${restaurantID}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error getting drinks items by restaurant: ${restaurantID} - ${err}`),
        );
      }
    }
  };

  validatePairings = async (pairingItemIDs: number[], restaurantID: number) => {
    if (pairingItemIDs.length > 0) {
      const drinkItemsToPair = await this.getDrinkItemsByIDsAndRestaurantID(pairingItemIDs, restaurantID);

      if (drinkItemsToPair.length !== pairingItemIDs.length) {
        logger.error(`Provided drink item id doesn't exist for restaurant: ${restaurantID}.`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Provided drink item id doesn't exist for restaurant: ${restaurantID}.`),
        );
      }
    }
  };
}

export default DrinkItemService;
