import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { RestaurantUserEmailsModelInterface } from '@interfaces/restaurantUserEmails.interface';
import { RestaurantUserEmailEntity } from '@entities/restaurantUserEmail.entity';

class RestaurantUserEmailsModel implements RestaurantUserEmailsModelInterface {
  fetchRestaurantUserEmailsByRestaurantID = async (restaurantUrlID: string, repository?: EntityManager): Promise<RestaurantUserEmailEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(RestaurantUserEmailEntity, {
        where: { restaurant_url_id: restaurantUrlID },
        order: { created_at: 'ASC' },
      });
    } catch (err) {
      logger.error(`Error occurred while fetching restaurant user emails for restaurant id: ${restaurantUrlID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurant user emails for restaurant id: ${restaurantUrlID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default RestaurantUserEmailsModel;
