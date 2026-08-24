import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { CareerRequestEntity } from '@entities/careerRequest.entity';
import { CareerRequestStatus, CareerRequestsModelInterface, ListCareerRequestsQueryInterface } from '@interfaces/careerRequests.interface';
import { getCurrentDate } from '@utils/timeUtils';

class CareerRequestsModel implements CareerRequestsModelInterface {
  fetchCareerRequestsByRestaurantID = async (
    restaurantID: number,
    filter: ListCareerRequestsQueryInterface,
    repository?: EntityManager,
  ): Promise<CareerRequestEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const query = repository
        .createQueryBuilder(CareerRequestEntity, 'career_request')
        .where('career_request.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('career_request.deleted_at IS NULL')
        .orderBy('career_request.created_at', 'DESC');

      if (filter?.status) {
        query.andWhere('career_request.status = :status', { status: filter.status });
      }

      return await query.getMany();
    } catch (err) {
      logger.error(`Error while fetching career requests for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching career requests for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  fetchCareerRequestByID = async (
    careerRequestID: number,
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<CareerRequestEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository
        .createQueryBuilder(CareerRequestEntity, 'career_request')
        .where('career_request.career_request_id = :careerRequestID', { careerRequestID })
        .andWhere('career_request.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('career_request.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      logger.error(`Error while fetching career request ${careerRequestID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching career request ${careerRequestID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  updateCareerRequestStatus = async (
    careerRequestID: number,
    restaurantID: number,
    status: CareerRequestStatus,
    repository?: EntityManager,
  ): Promise<CareerRequestEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      // Filter out soft-deleted rows in the predicate so a concurrent delete
      // can't be masked by a no-op update. result.affected = 0 means the row
      // either never existed or was deleted between the service's check and now.
      const result = await repository
        .createQueryBuilder()
        .update(CareerRequestEntity)
        .set({ status, updated_at: getCurrentDate() })
        .where('career_request_id = :careerRequestID', { careerRequestID })
        .andWhere('restaurant_id = :restaurantID', { restaurantID })
        .andWhere('deleted_at IS NULL')
        .execute();

      if (!result.affected) {
        return undefined;
      }

      return await this.fetchCareerRequestByID(careerRequestID, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating status for career request ${careerRequestID} on restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while updating status for career request ${careerRequestID} on restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  softDeleteCareerRequest = async (careerRequestID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(
        CareerRequestEntity,
        { career_request_id: careerRequestID, restaurant_id: restaurantID },
        { deleted_at: getCurrentDate(), updated_at: getCurrentDate() },
      );
    } catch (err) {
      logger.error(`Error while deleting career request ${careerRequestID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while deleting career request ${careerRequestID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default CareerRequestsModel;
