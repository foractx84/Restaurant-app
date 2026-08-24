import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { RestaurantProfileMediaModelInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';
import { getCurrentDate } from '@/utils/timeUtils';

class RestaurantProfileMediaModel implements RestaurantProfileMediaModelInterface {
  softDeleteRestaurantProfileMediaBySectionID = async (sectionID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(RestaurantProfileMediaEntity, { restaurantProfileSectionID: sectionID }, { deletedAt: getCurrentDate() });
    } catch (err) {
      logger.error(`Error deleting restaurant profile media for page sectionID: ${sectionID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error deleting restaurant profile media for page section: ${sectionID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertRestaurantProfileMediaForPageSection = async (
    restaurantProfileMediaEntity: RestaurantProfileMediaEntity[],
    repository?: EntityManager,
  ): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(RestaurantProfileMediaEntity, restaurantProfileMediaEntity);
    } catch (err) {
      logger.error(`Error inserting restaurant profile media for page section: ${JSON.stringify(restaurantProfileMediaEntity)}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error inserting restaurant profile media for page section: ${JSON.stringify(restaurantProfileMediaEntity)}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantProfileMediaModel;
