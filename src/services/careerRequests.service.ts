import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  CareerRequestResponseInterface,
  CareerRequestStatus,
  CareerRequestsModelInterface,
  CareerRequestsServiceInterface,
  ListCareerRequestsQueryInterface,
} from '@interfaces/careerRequests.interface';
import { CareerRequestEntity } from '@/entities/careerRequest.entity';

class CareerRequestsService implements CareerRequestsServiceInterface {
  private careerRequestsModel: CareerRequestsModelInterface;

  constructor(careerRequestsModel: CareerRequestsModelInterface) {
    this.careerRequestsModel = careerRequestsModel;
  }

  listCareerRequests = async (restaurantID: number, filter: ListCareerRequestsQueryInterface): Promise<CareerRequestResponseInterface[]> => {
    try {
      const requests = await this.careerRequestsModel.fetchCareerRequestsByRestaurantID(restaurantID, filter);
      return requests.map(request => this.toResponse(request));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while listing career requests for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while listing career requests for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getCareerRequest = async (careerRequestID: number, restaurantID: number): Promise<CareerRequestResponseInterface> => {
    try {
      const request = await this.careerRequestsModel.fetchCareerRequestByID(careerRequestID, restaurantID);
      if (!request) {
        logger.error(`Career request ${careerRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Career request ${careerRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }
      return this.toResponse(request);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while fetching career request ${careerRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while fetching career request ${careerRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateCareerRequestStatus = async (
    careerRequestID: number,
    restaurantID: number,
    status: CareerRequestStatus,
  ): Promise<CareerRequestResponseInterface> => {
    try {
      const existing = await this.careerRequestsModel.fetchCareerRequestByID(careerRequestID, restaurantID);
      if (!existing) {
        logger.error(`Career request ${careerRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Career request ${careerRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }

      const updated = await this.careerRequestsModel.updateCareerRequestStatus(careerRequestID, restaurantID, status);
      if (!updated) {
        // Concurrent soft-delete between the existence check and the update.
        // Surface as 404 rather than returning a null body with 200.
        logger.warn(`Career request ${careerRequestID} disappeared during status update for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Career request ${careerRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }
      return this.toResponse(updated);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating status of career request ${careerRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while updating status of career request ${careerRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteCareerRequest = async (careerRequestID: number, restaurantID: number): Promise<void> => {
    try {
      const existing = await this.careerRequestsModel.fetchCareerRequestByID(careerRequestID, restaurantID);
      if (!existing) {
        logger.error(`Career request ${careerRequestID} not found for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Career request ${careerRequestID} does not exist for restaurant ${restaurantID}.`),
        );
      }

      await this.careerRequestsModel.softDeleteCareerRequest(careerRequestID, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while deleting career request ${careerRequestID} for restaurantID: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error while deleting career request ${careerRequestID} for restaurantID: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  private toResponse = (entity: CareerRequestEntity): CareerRequestResponseInterface => ({
    careerRequestID: entity.career_request_id,
    restaurantID: entity.restaurant_id,
    firstName: entity.first_name,
    lastName: entity.last_name,
    email: entity.email,
    phoneNumber: entity.phone_number,
    positionAppliedFor: entity.position_applied_for,
    additionalInformation: entity.additional_information ?? null,
    howDidYouHear: entity.how_did_you_hear ?? null,
    status: entity.status,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  });
}

export default CareerRequestsService;
