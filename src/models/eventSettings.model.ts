import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { EventSettingsEntity } from '@entities/eventSettings.entity';
import { EventSettingsDBInterface, EventSettingsModelInterface } from '@interfaces/eventSettings.interface';

class EventSettingsModel implements EventSettingsModelInterface {
  fetchByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<EventSettingsEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .createQueryBuilder(EventSettingsEntity, 'event_settings')
        .where('event_settings.restaurant_id = :restaurantID', { restaurantID })
        .getOne();
    } catch (err) {
      logger.error(`Error while fetching event settings for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching event settings for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  upsertByRestaurantID = async (
    restaurantID: number,
    patch: Partial<EventSettingsDBInterface>,
    repository?: EntityManager,
  ): Promise<EventSettingsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const existing = await this.fetchByRestaurantID(restaurantID, repository);
      if (existing) {
        const merged = repository.create(EventSettingsEntity, {
          ...existing,
          ...patch,
          restaurant_id: restaurantID,
        });
        return await repository.save(EventSettingsEntity, merged);
      }
      const created = repository.create(EventSettingsEntity, {
        section_title: '',
        events_text: '',
        is_inquiry_form_enabled: false,
        ...patch,
        restaurant_id: restaurantID,
      });
      return await repository.save(EventSettingsEntity, created);
    } catch (err) {
      logger.error(`Error while upserting event settings for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while upserting event settings for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default EventSettingsModel;
