import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { EventMediaEntity } from '@entities/eventMedia.entity';
import { EventMediaInsertInterface, EventMediaModelInterface, EventMediaType } from '@interfaces/eventMedia.interface';
import { getCurrentDate } from '@utils/timeUtils';

class EventMediaModel implements EventMediaModelInterface {
  fetchByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<EventMediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .createQueryBuilder(EventMediaEntity, 'event_media')
        .where('event_media.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('event_media.deleted_at IS NULL')
        .orderBy('event_media.list_order', 'ASC')
        .getMany();
    } catch (err) {
      logger.error(`Error while fetching event media for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching event media for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  fetchByID = async (eventMediaID: number, restaurantID: number, repository?: EntityManager): Promise<EventMediaEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .createQueryBuilder(EventMediaEntity, 'event_media')
        .where('event_media.event_media_id = :eventMediaID', { eventMediaID })
        .andWhere('event_media.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('event_media.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      logger.error(`Error while fetching event media ${eventMediaID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching event media ${eventMediaID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  fetchMaxListOrder = async (restaurantID: number, repository?: EntityManager): Promise<number> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const result = await repository
        .createQueryBuilder(EventMediaEntity, 'event_media')
        .select('MAX(event_media.list_order)', 'max')
        .where('event_media.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('event_media.deleted_at IS NULL')
        .getRawOne<{ max: number | string | null }>();
      // pg sometimes returns MAX(int4) as a string; coerce defensively so the
      // caller can do arithmetic without surprise concatenation.
      return result?.max == null ? -1 : Number(result.max);
    } catch (err) {
      logger.error(`Error while reading event media max list order for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while reading event media max list order for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertMany = async (
    restaurantID: number,
    items: EventMediaInsertInterface[],
    startingOrder: number,
    repository?: EntityManager,
  ): Promise<EventMediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const rows = items.map((item, index) =>
        repository!.create(EventMediaEntity, {
          restaurant_id: restaurantID,
          media_url: item.mediaUrl,
          media_type: item.mediaType,
          list_order: startingOrder + index,
          alt_text: item.altText ?? undefined,
        }),
      );
      return await repository.save(EventMediaEntity, rows);
    } catch (err) {
      logger.error(`Error while inserting event media for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while inserting event media for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  setListOrder = async (eventMediaID: number, restaurantID: number, listOrder: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository
        .createQueryBuilder()
        .update(EventMediaEntity)
        .set({ list_order: listOrder, updated_at: getCurrentDate() })
        .where('event_media_id = :eventMediaID', { eventMediaID })
        .andWhere('restaurant_id = :restaurantID', { restaurantID })
        .andWhere('deleted_at IS NULL')
        .execute();
    } catch (err) {
      logger.error(`Error while reordering event media ${eventMediaID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while reordering event media ${eventMediaID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  softDelete = async (eventMediaID: number, restaurantID: number, repository?: EntityManager): Promise<EventMediaEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const existing = await this.fetchByID(eventMediaID, restaurantID, repository);
      if (!existing) return undefined;
      await repository
        .createQueryBuilder()
        .update(EventMediaEntity)
        .set({ deleted_at: getCurrentDate(), updated_at: getCurrentDate() })
        .where('event_media_id = :eventMediaID', { eventMediaID })
        .andWhere('restaurant_id = :restaurantID', { restaurantID })
        .andWhere('deleted_at IS NULL')
        .execute();
      return existing;
    } catch (err) {
      logger.error(`Error while soft-deleting event media ${eventMediaID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while soft-deleting event media ${eventMediaID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  countByRestaurantAndType = async (restaurantID: number, mediaType: EventMediaType, repository?: EntityManager): Promise<number> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .createQueryBuilder(EventMediaEntity, 'event_media')
        .where('event_media.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('event_media.media_type = :mediaType', { mediaType })
        .andWhere('event_media.deleted_at IS NULL')
        .getCount();
    } catch (err) {
      logger.error(`Error while counting event media for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while counting event media for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default EventMediaModel;
