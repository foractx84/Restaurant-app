import { RestaurantSocialsEntity } from '@entities/restaurantSocials.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantSocialsDBInterface, RestaurantSocialsModelInterface } from '@interfaces/restaurantSocials.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantSocialsModel implements RestaurantSocialsModelInterface {
  getRestaurantSocialsByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantSocialsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(RestaurantSocialsEntity, { restaurant_id: restaurantID });
    } catch (err) {
      logger.error(`Error occurred while getting restaurant social for restaurantID ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant social for restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertRestaurantSocials = async (restaurantSocials: RestaurantSocialsDBInterface, repository?: EntityManager): Promise<RestaurantSocialsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.save(RestaurantSocialsEntity, restaurantSocials);
    } catch (err) {
      logger.error(`Error occurred while saving restaurant social links for restaurant socials ${JSON.stringify(restaurantSocials)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while saving restaurant social links for restaurant socials ${JSON.stringify(
            restaurantSocials,
          )}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateRestaurantSocials = async (restaurantSocials: RestaurantSocialsDBInterface, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(RestaurantSocialsEntity, restaurantSocials.restaurant_socials_id, { ...restaurantSocials });
    } catch (err) {
      logger.error(`Error occurred while updating restaurant social links for restaurant socials ${JSON.stringify(restaurantSocials)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating restaurant social links for restaurant socials ${JSON.stringify(
            restaurantSocials,
          )}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantSocialsModel;
