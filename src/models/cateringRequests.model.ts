import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { CateringRequestEntity } from '@entities/cateringRequest.entity';
import { CateringRequestStatus, CateringRequestsModelInterface, ListCateringRequestsQueryInterface } from '@interfaces/cateringRequests.interface';
import { getCurrentDate } from '@utils/timeUtils';

class CateringRequestsModel implements CateringRequestsModelInterface {
  fetchCateringRequestsByRestaurantID = async (
    restaurantID: number,
    filter: ListCateringRequestsQueryInterface,
    repository?: EntityManager,
  ): Promise<CateringRequestEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const query = repository
        .createQueryBuilder(CateringRequestEntity, 'catering_request')
        .where('catering_request.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('catering_request.deleted_at IS NULL')
        .orderBy('catering_request.created_at', 'DESC');

      if (filter?.status) {
        query.andWhere('catering_request.status = :status', { status: filter.status });
      }

      return await query.getMany();
    } catch (err) {
      logger.error(`Error while fetching catering requests for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching catering requests for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  fetchCateringRequestByID = async (
    cateringRequestID: number,
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<CateringRequestEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository
        .createQueryBuilder(CateringRequestEntity, 'catering_request')
        .where('catering_request.catering_request_id = :cateringRequestID', { cateringRequestID })
        .andWhere('catering_request.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('catering_request.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      logger.error(`Error while fetching catering request ${cateringRequestID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching catering request ${cateringRequestID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  updateCateringRequestStatus = async (
    cateringRequestID: number,
    restaurantID: number,
    status: CateringRequestStatus,
    repository?: EntityManager,
  ): Promise<CateringRequestEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      // Filter out soft-deleted rows in the predicate so a concurrent delete
      // can't be masked by a no-op update. result.affected = 0 means the row
      // either never existed or was deleted between the service's check and now.
      const result = await repository
        .createQueryBuilder()
        .update(CateringRequestEntity)
        .set({ status, updated_at: getCurrentDate() })
        .where('catering_request_id = :cateringRequestID', { cateringRequestID })
        .andWhere('restaurant_id = :restaurantID', { restaurantID })
        .andWhere('deleted_at IS NULL')
        .execute();

      if (!result.affected) {
        return undefined;
      }

      return await this.fetchCateringRequestByID(cateringRequestID, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error while updating status for catering request ${cateringRequestID} on restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while updating status for catering request ${cateringRequestID} on restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  softDeleteCateringRequest = async (cateringRequestID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(
        CateringRequestEntity,
        { catering_request_id: cateringRequestID, restaurant_id: restaurantID },
        { deleted_at: getCurrentDate(), updated_at: getCurrentDate() },
      );
    } catch (err) {
      logger.error(`Error while deleting catering request ${cateringRequestID} for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while deleting catering request ${cateringRequestID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default CateringRequestsModel;
