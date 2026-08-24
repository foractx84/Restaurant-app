import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import {
  EventSettingsModelInterface,
  EventSettingsResponseInterface,
  EventSettingsServiceInterface,
  UpdateEventSettingsRequestInterface,
} from '@interfaces/eventSettings.interface';

class EventSettingsService implements EventSettingsServiceInterface {
  private eventSettingsModel: EventSettingsModelInterface;
  private restaurantsService: RestaurantsServiceInterface;

  constructor(eventSettingsModel: EventSettingsModelInterface, restaurantsService: RestaurantsServiceInterface) {
    this.eventSettingsModel = eventSettingsModel;
    this.restaurantsService = restaurantsService;
  }

  getEventSettings = async (restaurantID: number): Promise<EventSettingsResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while fetching event settings.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }
      const settings = await this.eventSettingsModel.fetchByRestaurantID(restaurantID);
      return {
        isEventsEnabled: !!restaurant.is_events_enabled,
        sectionTitle: settings?.section_title ?? '',
        eventsText: settings?.events_text ?? '',
        deckUrl: settings?.deck_url ?? null,
        isInquiryFormEnabled: !!settings?.is_inquiry_form_enabled,
        notificationEmail: settings?.notification_email ?? null,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching event settings for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching event settings for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateEventSettings = async (restaurantID: number, update: UpdateEventSettingsRequestInterface): Promise<EventSettingsResponseInterface> => {
    try {
      const restaurant = await this.restaurantsService.findRestaurantEntityByID(restaurantID);
      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} not found while updating event settings.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }

      // is_events_enabled lives on restaurants table (mirroring catering's flag);
      // everything else lives on event_settings. Two writes, no shared transaction —
      // the restaurants update is idempotent and the settings upsert is a single
      // statement, so worst case after a partial failure the user retries.
      await this.restaurantsService.updateRestaurantEntity({ is_events_enabled: update.isEventsEnabled }, restaurantID);

      // Build a patch with only the fields the caller actually touched. Sending
      // `null` for deckUrl or notificationEmail is the "clear" gesture; omitting
      // leaves the existing value untouched.
      const settingsPatch: Record<string, unknown> = {};
      if (update.sectionTitle !== undefined) settingsPatch.section_title = update.sectionTitle;
      if (update.eventsText !== undefined) settingsPatch.events_text = update.eventsText;
      if (Object.prototype.hasOwnProperty.call(update, 'deckUrl')) settingsPatch.deck_url = update.deckUrl ?? null;
      if (update.isInquiryFormEnabled !== undefined) settingsPatch.is_inquiry_form_enabled = update.isInquiryFormEnabled;
      if (Object.prototype.hasOwnProperty.call(update, 'notificationEmail')) settingsPatch.notification_email = update.notificationEmail ?? null;

      const saved = await this.eventSettingsModel.upsertByRestaurantID(restaurantID, settingsPatch);

      return {
        isEventsEnabled: update.isEventsEnabled,
        sectionTitle: saved.section_title ?? '',
        eventsText: saved.events_text ?? '',
        deckUrl: saved.deck_url ?? null,
        isInquiryFormEnabled: !!saved.is_inquiry_form_enabled,
        notificationEmail: saved.notification_email ?? null,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating event settings for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating event settings for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default EventSettingsService;
