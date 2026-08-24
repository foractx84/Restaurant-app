import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  EventRequestResponseInterface,
  EventRequestStatus,
  EventRequestsModelInterface,
  EventRequestsServiceInterface,
  ListEventRequestsQueryInterface,
} from '@interfaces/eventRequests.interface';
import { EventRequestEntity } from '@/entities/eventRequest.entity';

class EventRequestsService implements EventRequestsServiceInterface {
  private eventRequestsModel: EventRequestsModelInterface;

  constructor(eventRequestsModel: EventRequestsModelInterface) {
    this.eventRequestsModel = eventRequestsModel;
  }

  listEventRequests = async (restaurantID: number, filter: ListEventRequestsQueryInterface): Promise<EventRequestResponseInterface[]> => {
    try {
      const requests = await this.eventRequestsModel.fetchEventRequestsByRestaurantID(restaurantID, filter);
      return requests.map(request => this.toResponse(request));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while listing event requests for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while listing event requests for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getEventRequest = async (eventRequestID: number, restaurantID: number): Promise<EventRequestResponseInterface> => {
    try {
      const request = await this.eventRequestsModel.fetchEventRequestByID(eventRequestID, restaurantID);
      if (!request) {
        logger.error(`Event request ${eventRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Event request ${eventRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }
      return this.toResponse(request);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching event request ${eventRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching event request ${eventRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateEventRequestStatus = async (
    eventRequestID: number,
    restaurantID: number,
    status: EventRequestStatus,
  ): Promise<EventRequestResponseInterface> => {
    try {
      const existing = await this.eventRequestsModel.fetchEventRequestByID(eventRequestID, restaurantID);
      if (!existing) {
        logger.error(`Event request ${eventRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Event request ${eventRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }

      const updated = await this.eventRequestsModel.updateEventRequestStatus(eventRequestID, restaurantID, status);
      if (!updated) {
        // Concurrent soft-delete between the existence check and the update.
        // Surface as 404 rather than returning a null body with 200.
        logger.warn(`Event request ${eventRequestID} disappeared during status update for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Event request ${eventRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }
      return this.toResponse(updated);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating status of event request ${eventRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating status of event request ${eventRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteEventRequest = async (eventRequestID: number, restaurantID: number): Promise<void> => {
    try {
      const existing = await this.eventRequestsModel.fetchEventRequestByID(eventRequestID, restaurantID);
      if (!existing) {
        logger.error(`Event request ${eventRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Event request ${eventRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }

      await this.eventRequestsModel.softDeleteEventRequest(eventRequestID, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while deleting event request ${eventRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while deleting event request ${eventRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  private toResponse = (entity: EventRequestEntity): EventRequestResponseInterface => ({
    eventRequestID: entity.event_request_id,
    restaurantID: entity.restaurant_id,
    firstName: entity.first_name,
    lastName: entity.last_name,
    email: entity.email,
    phoneNumber: entity.phone_number,
    company: entity.company ?? null,
    typeOfEvent: entity.type_of_event,
    styleOfEvent: entity.style_of_event,
    eventAt: entity.event_at,
    numberOfPeople: entity.number_of_people,
    additionalInformation: entity.additional_information ?? null,
    howDidYouHear: entity.how_did_you_hear ?? null,
    status: entity.status,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  });
}

export default EventRequestsService;
