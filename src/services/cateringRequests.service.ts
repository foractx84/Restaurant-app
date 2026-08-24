import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  CateringRequestResponseInterface,
  CateringRequestStatus,
  CateringRequestsModelInterface,
  CateringRequestsServiceInterface,
  ListCateringRequestsQueryInterface,
} from '@interfaces/cateringRequests.interface';
import { CateringRequestEntity } from '@/entities/cateringRequest.entity';

class CateringRequestsService implements CateringRequestsServiceInterface {
  private cateringRequestsModel: CateringRequestsModelInterface;

  constructor(cateringRequestsModel: CateringRequestsModelInterface) {
    this.cateringRequestsModel = cateringRequestsModel;
  }

  listCateringRequests = async (restaurantID: number, filter: ListCateringRequestsQueryInterface): Promise<CateringRequestResponseInterface[]> => {
    try {
      const requests = await this.cateringRequestsModel.fetchCateringRequestsByRestaurantID(restaurantID, filter);
      return requests.map(request => this.toResponse(request));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while listing catering requests for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while listing catering requests for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getCateringRequest = async (cateringRequestID: number, restaurantID: number): Promise<CateringRequestResponseInterface> => {
    try {
      const request = await this.cateringRequestsModel.fetchCateringRequestByID(cateringRequestID, restaurantID);
      if (!request) {
        logger.error(`Catering request ${cateringRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Catering request ${cateringRequestID} does not exist for restaurant ${restaurantID}.`,
          ),
        );
      }
      return this.toResponse(request);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching catering request ${cateringRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching catering request ${cateringRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateCateringRequestStatus = async (
    cateringRequestID: number,
    restaurantID: number,
    status: CateringRequestStatus,
  ): Promise<CateringRequestResponseInterface> => {
    try {
      const existing = await this.cateringRequestsModel.fetchCateringRequestByID(cateringRequestID, restaurantID);
      if (!existing) {
        logger.error(`Catering request ${cateringRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Catering request ${cateringRequestID} does not exist for restaurant ${restaurantID}.`,
          ),
        );
      }

      const updated = await this.cateringRequestsModel.updateCateringRequestStatus(cateringRequestID, restaurantID, status);
      if (!updated) {
        // Concurrent soft-delete between the existence check and the update.
        // Surface as 404 rather than returning a null body with 200.
        logger.warn(`Catering request ${cateringRequestID} disappeared during status update for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Catering request ${cateringRequestID} does not exist for restaurant ${restaurantID}.`,
          ),
        );
      }
      return this.toResponse(updated);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating status of catering request ${cateringRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating status of catering request ${cateringRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteCateringRequest = async (cateringRequestID: number, restaurantID: number): Promise<void> => {
    try {
      const existing = await this.cateringRequestsModel.fetchCateringRequestByID(cateringRequestID, restaurantID);
      if (!existing) {
        logger.error(`Catering request ${cateringRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Catering request ${cateringRequestID} does not exist for restaurant ${restaurantID}.`,
          ),
        );
      }

      await this.cateringRequestsModel.softDeleteCateringRequest(cateringRequestID, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while deleting catering request ${cateringRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while deleting catering request ${cateringRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  private toResponse = (entity: CateringRequestEntity): CateringRequestResponseInterface => ({
    cateringRequestID: entity.catering_request_id,
    restaurantID: entity.restaurant_id,
    firstName: entity.first_name,
    lastName: entity.last_name,
    email: entity.email,
    phoneNumber: entity.phone_number,
    streetAddress1: entity.street_address_1,
    streetAddress2: entity.street_address_2 ?? null,
    city: entity.city,
    state: entity.state,
    zipCode: entity.zip_code,
    company: entity.company ?? null,
    numberOfPeople: entity.number_of_people,
    typeOfEvent: entity.type_of_event,
    eventStartAt: entity.event_start_at,
    eventEndAt: entity.event_end_at,
    styleOfCatering: entity.style_of_catering ?? null,
    specialRequests: entity.special_requests,
    additionalInformation: entity.additional_information ?? null,
    howDidYouHear: entity.how_did_you_hear ?? null,
    status: entity.status,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  });
}

export default CateringRequestsService;
