import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  RestaurantUserEmailsModelInterface,
  RestaurantUserEmailsResponseInterface,
  RestaurantUserEmailsServiceInterface,
} from '@interfaces/restaurantUserEmails.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';

class RestaurantUserEmailsService implements RestaurantUserEmailsServiceInterface {
  private restaurantService: RestaurantsServiceInterface;
  private restaurantUserEmailsModel: RestaurantUserEmailsModelInterface;

  constructor(restaurantService: RestaurantsServiceInterface, restaurantUserEmailsModel: RestaurantUserEmailsModelInterface) {
    this.restaurantService = restaurantService;
    this.restaurantUserEmailsModel = restaurantUserEmailsModel;
  }

  getRestaurantUserEmails = async (restaurantID: number): Promise<RestaurantUserEmailsResponseInterface[]> => {
    try {
      const restaurant = await this.restaurantService.findRestaurantEntityByID(restaurantID);

      if (!restaurant) {
        logger.error(`Restaurant does not exist for provided id ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant does not exist for provided id ${restaurantID}.`),
        );
      }

      const emails: RestaurantUserEmailEntity[] = await this.restaurantUserEmailsModel.fetchRestaurantUserEmailsByRestaurantID(
        restaurant.restaurant_url_id,
      );
      return emails?.map(email => email?.toResponse()) ?? [];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting users submitted emails for restaurant: ${restaurantID}. - ${err.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting users submitted emails for restaurant: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default RestaurantUserEmailsService;
