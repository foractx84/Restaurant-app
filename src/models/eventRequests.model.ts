import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { EventRequestEntity } from '@entities/eventRequest.entity';
import { EventRequestStatus, EventRequestsModelInterface, ListEventRequestsQueryInterface } from '@interfaces/eventRequests.interface';
import { getCurrentDate } from '@utils/timeUtils';

class EventRequestsModel implements EventRequestsModelInterface {
  fetchEventRequestsByRestaurantID = async (
    restaurantID: number,
    filter: ListEventRequestsQueryInterface,
    repository?: EntityManager,
  ): Promise<EventRequestEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const query = repository
        .createQueryBuilder(EventRequestEntity, 'event_request')
        .where('event_request.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('event_request.deleted_at IS NULL')
        .orderBy('event_request.created_at', 'DESC');

      if (filter?.status) {
        query.andWhere('event_request.status = :status', { status: filter.status });
      }

      return await query.getMany();
    } catch (err) {
      logger.error(`Error while fetching event requests for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching event requests for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  fetchEventRequestByID = async (
    eventRequestID: number,
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<EventRequestEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository
        .createQueryBuilder(EventRequestEntity, 'event_request')
        .where('event_request.event_request_id = :eventRequestID', { eventRequestID })
        .andWhere('event_request.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('event_request.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      logger.error(`Error while fetching event request ${eventRequestID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching event request ${eventRequestID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  updateEventRequestStatus = async (
    eventRequestID: number,
    restaurantID: number,
    status: EventRequestStatus,
    repository?: EntityManager,
  ): Promise<EventRequestEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      // Filter out soft-deleted rows in the predicate so a concurrent delete
      // can't be masked by a no-op update. result.affected = 0 means the row
      // either never existed or was deleted between the service's check and now.
      const result = await repository
        .createQueryBuilder()
        .update(EventRequestEntity)
        .set({ status, updated_at: getCurrentDate() })
        .where('event_request_id = :eventRequestID', { eventRequestID })
        .andWhere('restaurant_id = :restaurantID', { restaurantID })
        .andWhere('deleted_at IS NULL')
        .execute();

      if (!result.affected) {
        return undefined;
      }

      return await this.fetchEventRequestByID(eventRequestID, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating status for event request ${eventRequestID} on restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while updating status for event request ${eventRequestID} on restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  softDeleteEventRequest = async (eventRequestID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(
        EventRequestEntity,
        { event_request_id: eventRequestID, restaurant_id: restaurantID },
        { deleted_at: getCurrentDate(), updated_at: getCurrentDate() },
      );
    } catch (err) {
      logger.error(`Error while deleting event request ${eventRequestID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while deleting event request ${eventRequestID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default EventRequestsModel;
