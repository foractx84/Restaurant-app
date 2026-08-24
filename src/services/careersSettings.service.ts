import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import {
  CareersSettingsModelInterface,
  CareersSettingsResponseInterface,
  CareersSettingsServiceInterface,
  UpdateCareersSettingsRequestInterface,
} from '@interfaces/careersSettings.interface';

class CareersSettingsService implements CareersSettingsServiceInterface {
  private careersSettingsModel: CareersSettingsModelInterface;
  private restaurantsService: RestaurantsServiceInterface;

  constructor(careersSettingsModel: CareersSettingsModelInterface, restaurantsService: RestaurantsServiceInterface) {
    this.careersSettingsModel = careersSettingsModel;
    this.restaurantsService = restaurantsService;
  }

  getCareersSettings = async (restaurantID: number): Promise<CareersSettingsResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while fetching careers settings.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }
      const settings = await this.careersSettingsModel.fetchByRestaurantID(restaurantID);
      return {
        isCareersEnabled: !!restaurant.is_careers_enabled,
        sectionTitle: settings?.section_title ?? '',
        careersText: settings?.careers_text ?? '',
        isInquiryFormEnabled: !!settings?.is_inquiry_form_enabled,
        notificationEmail: settings?.notification_email ?? null,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching careers settings for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching careers settings for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateCareersSettings = async (restaurantID: number, update: UpdateCareersSettingsRequestInterface): Promise<CareersSettingsResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while updating careers settings.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }

      // is_careers_enabled lives on restaurants table (mirroring catering/events
      // flags); everything else lives on careers_settings. Two writes, no shared
      // transaction — the restaurants update is idempotent and the settings upsert
      // is a single statement, so worst case after a partial failure the user retries.
      await this.restaurantsService.updateRestaurantEntity({ is_careers_enabled: update.isCareersEnabled }, restaurantID);

      // Build a patch with only the fields the caller actually touched. Sending
      // `null` for notificationEmail is the "clear" gesture; omitting leaves the
      // existing value untouched.
      const settingsPatch: Record<string, unknown> = {};
      if (update.sectionTitle !== undefined) settingsPatch.section_title = update.sectionTitle;
      if (update.careersText !== undefined) settingsPatch.careers_text = update.careersText;
      if (update.isInquiryFormEnabled !== undefined) settingsPatch.is_inquiry_form_enabled = update.isInquiryFormEnabled;
      if (Object.prototype.hasOwnProperty.call(update, 'notificationEmail')) settingsPatch.notification_email = update.notificationEmail ?? null;

      const saved = await this.careersSettingsModel.upsertByRestaurantID(restaurantID, settingsPatch);

      return {
        isCareersEnabled: update.isCareersEnabled,
        sectionTitle: saved.section_title ?? '',
        careersText: saved.careers_text ?? '',
        isInquiryFormEnabled: !!saved.is_inquiry_form_enabled,
        notificationEmail: saved.notification_email ?? null,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating careers settings for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating careers settings for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default CareersSettingsService;
