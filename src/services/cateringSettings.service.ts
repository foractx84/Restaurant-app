import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import {
  CateringSettingsResponseInterface,
  CateringSettingsServiceInterface,
  UpdateCateringSettingsRequestInterface,
} from '@interfaces/cateringSettings.interface';

class CateringSettingsService implements CateringSettingsServiceInterface {
  private restaurantsService: RestaurantsServiceInterface;

  constructor(restaurantsService: RestaurantsServiceInterface) {
    this.restaurantsService = restaurantsService;
  }

  getCateringSettings = async (restaurantID: number): Promise<CateringSettingsResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while fetching catering settings.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }

      return {
        isCateringEnabled: !!restaurant.is_catering_enabled,
        cateringNotificationEmail: restaurant.catering_notification_email ?? null,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching catering settings for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching catering settings for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateCateringSettings = async (
    restaurantID: number,
    update: UpdateCateringSettingsRequestInterface,
  ): Promise<CateringSettingsResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while updating catering settings.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }

      // Only touch the email column when the caller actually included the
      // field. Sending `null` explicitly is the "clear override" gesture;
      // omitting the field leaves the existing value untouched.
      const emailIsTouched = Object.prototype.hasOwnProperty.call(update, 'cateringNotificationEmail');
      const nextEmail: string | null = emailIsTouched ? update.cateringNotificationEmail ?? null : restaurant.catering_notification_email ?? null;

      const patch: { is_catering_enabled: boolean; catering_notification_email?: string | null } = {
        is_catering_enabled: update.isCateringEnabled,
      };
      if (emailIsTouched) {
        patch.catering_notification_email = nextEmail;
      }

      await this.restaurantsService.updateRestaurantEntity(patch, restaurantID);

      return {
        isCateringEnabled: update.isCateringEnabled,
        cateringNotificationEmail: nextEmail,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating catering settings for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating catering settings for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default CateringSettingsService;
