import { RestaurantSocialsEntity } from '@/entities/restaurantSocials.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  RestaurantSocialsDBInterface,
  RestaurantSocialsInterface,
  RestaurantSocialsModelInterface,
  RestaurantSocialsServiceInterface,
} from '@/interfaces/restaurantSocials.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantSocialsService implements RestaurantSocialsServiceInterface {
  private restaurantSocialsModel: RestaurantSocialsModelInterface;

  constructor(restaurantSocialsModel: RestaurantSocialsModelInterface) {
    this.restaurantSocialsModel = restaurantSocialsModel;
  }

  createRestaurantSocials = async (restaurantSocials: RestaurantSocialsInterface, repository?: EntityManager): Promise<RestaurantSocialsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.restaurantSocialsModel.insertRestaurantSocials(this.buildRestaurantSocialsInsert(restaurantSocials), repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating restaurant socials for restaurant socials: ${JSON.stringify(restaurantSocials)}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating restaurant socials for restaurant socials: ${JSON.stringify(
              restaurantSocials,
            )}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getRestaurantSocialsByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantSocialsInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return this.buildGetRestaurantSocials(await this.restaurantSocialsModel.getRestaurantSocialsByRestaurantID(restaurantID, repository));
    } catch (err) {
      logger.error(`Error occurred while getting restaurant social for restaurantID ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while getting restaurant social for restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateRestaurantSocials = async (restaurantSocials: RestaurantSocialsInterface, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantSocialsModel.updateRestaurantSocials(this.buildRestaurantSocialsUpdate(restaurantSocials), repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while updating restaurant socials for restaurant: ${restaurantSocials.restaurantID}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating or updating restaurant socials for restaurant: ${restaurantSocials.restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  buildGetRestaurantSocials = (restaurantSocials: RestaurantSocialsEntity): RestaurantSocialsInterface => {
    return {
      restaurantSocialsID: restaurantSocials?.restaurant_socials_id,
      restaurantID: restaurantSocials?.restaurant_id,
      facebook: restaurantSocials?.facebook || '',
      instagram: restaurantSocials?.instagram || '',
      snapchat: restaurantSocials?.snapchat || '',
      tiktok: restaurantSocials?.tiktok || '',
      twitter: restaurantSocials?.twitter || '',
    };
  };

  buildRestaurantSocialsUpdate = (restaurantSocials: RestaurantSocialsInterface): RestaurantSocialsDBInterface => {
    const restaurantSocialsUpdate = {};
    // set to null if empty string, change to snake case for restaurantSocialsID
    Object.keys(restaurantSocials)?.forEach(social => {
      if (social !== 'restaurantSocialsID') {
        restaurantSocialsUpdate[social] = restaurantSocials[social]?.length ? restaurantSocials[social] : null;
      } else {
        restaurantSocialsUpdate['restaurant_socials_id'] = restaurantSocials[social];
      }
    });
    return restaurantSocialsUpdate;
  };

  buildRestaurantSocialsInsert = (restaurantSocials: RestaurantSocialsInterface): RestaurantSocialsDBInterface => {
    return {
      restaurant_id: restaurantSocials.restaurantID,
      // need to do these to handle empty strings set to null
      facebook: restaurantSocials?.facebook || null,
      instagram: restaurantSocials?.instagram || null,
      snapchat: restaurantSocials?.snapchat || null,
      tiktok: restaurantSocials?.tiktok || null,
      twitter: restaurantSocials?.twitter || null,
    };
  };
}

export default RestaurantSocialsService;
