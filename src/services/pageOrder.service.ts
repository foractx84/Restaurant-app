import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import {
  PageOrderModelInterface,
  PageOrderResponseInterface,
  PageOrderServiceInterface,
  UpdatePageOrderRequestInterface,
} from '@interfaces/pageOrder.interface';

class PageOrderService implements PageOrderServiceInterface {
  private pageOrderModel: PageOrderModelInterface;
  private restaurantsService: RestaurantsServiceInterface;

  constructor(pageOrderModel: PageOrderModelInterface, restaurantsService: RestaurantsServiceInterface) {
    this.pageOrderModel = pageOrderModel;
    this.restaurantsService = restaurantsService;
  }

  getPageOrder = async (restaurantID: number): Promise<PageOrderResponseInterface> => {
    try {
      const rows = await this.pageOrderModel.fetchByRestaurantID(restaurantID);
      return { order: rows.map(row => row.page_key) };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching page order for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching page order for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updatePageOrder = async (restaurantID: number, update: UpdatePageOrderRequestInterface): Promise<PageOrderResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while updating page order.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }

      // Reject duplicate keys: the same page can't appear twice in the nav, and a duplicate would
      // also violate the table's (restaurant_id, page_key) unique constraint mid-transaction.
      if (new Set(update.order).size !== update.order.length) {
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Page order must not contain duplicate page keys.'),
        );
      }

      const saved = await this.pageOrderModel.replaceForRestaurant(restaurantID, update.order);
      return { order: saved.map(row => row.page_key) };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating page order for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating page order for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default PageOrderService;
