import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  EventMediaInsertInterface,
  EventMediaModelInterface,
  EventMediaResponseInterface,
  EventMediaServiceInterface,
  ReorderEventMediaItemInterface,
} from '@interfaces/eventMedia.interface';
import { EntityManager } from 'typeorm';
import { EventMediaEntity } from '@/entities/eventMedia.entity';
import { deleteMediaIfExists, obtainMedia } from '@utils/imageUtils';
import { ormConnection } from '@utils/dbUtils';
import { EVENT_MEDIA } from '@/configs/config';

class EventMediaService implements EventMediaServiceInterface {
  private eventMediaModel: EventMediaModelInterface;

  constructor(eventMediaModel: EventMediaModelInterface) {
    this.eventMediaModel = eventMediaModel;
  }

  listEventMedia = async (restaurantID: number): Promise<EventMediaResponseInterface[]> => {
    try {
      const rows = await this.eventMediaModel.fetchByRestaurantID(restaurantID);
      return rows.map(this.toResponse);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      logger.error(`Error while listing event media for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while listing event media for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertEventMedia = async (restaurantID: number, items: EventMediaInsertInterface[]): Promise<EventMediaResponseInterface[]> => {
    try {
      if (!items.length) return [];

      // Enforce per-restaurant caps before writing. New images and the (single)
      // video are counted against existing not-deleted rows so callers can't
      // accumulate beyond the limit across multiple uploads.
      const newImages = items.filter(i => i.mediaType === 'image').length;
      const newVideos = items.filter(i => i.mediaType === 'video').length;

      if (newImages > 0) {
        const existingImages = await this.eventMediaModel.countByRestaurantAndType(restaurantID, 'image');
        if (existingImages + newImages > EVENT_MEDIA.MAX_EVENT_IMAGES) {
          throw new HttpException(
            400,
            getErrorPayload(
              InternalErrorCode.runtimeError,
              `Event media image limit exceeded (have ${existingImages}, attempting to add ${newImages}, max ${EVENT_MEDIA.MAX_EVENT_IMAGES}).`,
            ),
          );
        }
      }

      if (newVideos > 0) {
        const existingVideos = await this.eventMediaModel.countByRestaurantAndType(restaurantID, 'video');
        if (existingVideos + newVideos > EVENT_MEDIA.MAX_EVENT_VIDEOS) {
          throw new HttpException(
            400,
            getErrorPayload(
              InternalErrorCode.runtimeError,
              `Event media video limit exceeded (have ${existingVideos}, attempting to add ${newVideos}, max ${EVENT_MEDIA.MAX_EVENT_VIDEOS}).`,
            ),
          );
        }
      }

      const maxOrder = await this.eventMediaModel.fetchMaxListOrder(restaurantID);
      const startingOrder = maxOrder + 1;
      const inserted = await this.eventMediaModel.insertMany(restaurantID, items, startingOrder);
      return inserted.map(this.toResponse);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      logger.error(`Error while inserting event media for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while inserting event media for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  reorderEventMedia = async (restaurantID: number, items: ReorderEventMediaItemInterface[]): Promise<void> => {
    try {
      // Snapshot the current ordering and require the caller to send a full
      // reorder over exactly the restaurant's current media. Partial reorders
      // are ambiguous (where do the unspecified items end up?) and the previous
      // two-pass implementation would collide with the (restaurant_id, list_order)
      // partial unique index whenever a moved item's target was held by an
      // item not in the request.
      const existing = await this.eventMediaModel.fetchByRestaurantID(restaurantID);

      if (items.length !== existing.length) {
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Reorder request must include all ${existing.length} active media items; received ${items.length}.`,
          ),
        );
      }

      const requestedIds = new Set<number>();
      for (const item of items) {
        if (requestedIds.has(item.eventMediaID)) {
          throw new HttpException(
            400,
            getErrorPayload(InternalErrorCode.runtimeError, `Reorder request contains duplicate eventMediaID ${item.eventMediaID}.`),
          );
        }
        requestedIds.add(item.eventMediaID);
      }

      const ownedIds = new Set(existing.map(e => e.event_media_id!));
      for (const item of items) {
        if (!ownedIds.has(item.eventMediaID)) {
          throw new HttpException(
            404,
            getErrorPayload(InternalErrorCode.inputValueNotInDB, `Event media ${item.eventMediaID} does not exist for restaurant ${restaurantID}.`),
          );
        }
      }

      const requestedOrders = new Set<number>();
      for (const item of items) {
        if (requestedOrders.has(item.listOrder)) {
          throw new HttpException(
            400,
            getErrorPayload(InternalErrorCode.runtimeError, `Reorder request contains duplicate listOrder ${item.listOrder}.`),
          );
        }
        requestedOrders.add(item.listOrder);
      }

      // Transaction so a mid-reorder failure rolls back instead of leaving
      // items stuck in the parked range.
      const ormConn = await ormConnection();
      await ormConn.transaction(async (manager: EntityManager) => {
        const PARK_OFFSET = 1_000_000;
        for (const row of existing) {
          await this.eventMediaModel.setListOrder(row.event_media_id!, restaurantID, PARK_OFFSET + row.event_media_id!, manager);
        }
        for (const item of items) {
          await this.eventMediaModel.setListOrder(item.eventMediaID, restaurantID, item.listOrder, manager);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) throw err;
      logger.error(`Error while reordering event media for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while reordering event media for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteEventMedia = async (eventMediaID: number, restaurantID: number): Promise<void> => {
    try {
      const removed = await this.eventMediaModel.softDelete(eventMediaID, restaurantID);
      if (!removed) {
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Event media ${eventMediaID} does not exist for restaurant ${restaurantID}.`),
        );
      }
      // Best-effort cloud delete; if it fails we have an orphan object in the
      // bucket but the DB is the source of truth (mirrors the existing menu
      // item media pattern). Errors are logged inside deleteMediaIfExists.
      try {
        if (removed.media_type === 'video') {
          await deleteMediaIfExists([], removed.media_url);
        } else {
          await deleteMediaIfExists([removed.media_url], '');
        }
      } catch (cleanupErr) {
        logger.error(`Failed to clean up event media file ${removed.media_url} for restaurantID: ${restaurantID}. - ${cleanupErr}`);
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      logger.error(`Error while deleting event media ${eventMediaID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while deleting event media ${eventMediaID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  private toResponse = (entity: EventMediaEntity): EventMediaResponseInterface => ({
    eventMediaID: entity.event_media_id,
    // Wrap the stored filename with the configured host prefix the FE expects;
    // matches the menu-item media convention via obtainMedia(url, 'image'|'video').
    mediaUrl: obtainMedia(entity.media_url, entity.media_type),
    mediaType: entity.media_type,
    listOrder: entity.list_order,
    altText: entity.alt_text ?? null,
  });
}

export default EventMediaService;
