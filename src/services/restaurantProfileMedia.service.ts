import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';
import { RestaurantProfileMediaModelInterface, RestaurantProfileMediaServiceInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { ormConnection } from '@/utils/dbUtils';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantProfileMediaService implements RestaurantProfileMediaServiceInterface {
  private restaurantProfileMediaModel: RestaurantProfileMediaModelInterface;

  constructor(restaurantProfileMediaModel: RestaurantProfileMediaModelInterface) {
    this.restaurantProfileMediaModel = restaurantProfileMediaModel;
  }

  softDeleteRestaurantProfileMediaBySectionID = async (sectionID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantProfileMediaModel.softDeleteRestaurantProfileMediaBySectionID(sectionID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting restaurant profile media by page sectionID: ${sectionID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting restaurant profile media by page sectionID: ${sectionID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  insertRestaurantProfileMediaForPageSection = async (mediaIDs: number[], sectionID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await this.restaurantProfileMediaModel.insertRestaurantProfileMediaForPageSection(
        mediaIDs.map((id, index) =>
          RestaurantProfileMediaEntity.createEntityFromRequest({
            restaurantProfileSectionID: sectionID,
            mediaID: id,
            restaurantProfileMediaID: null,
            listOrder: index,
          }),
        ),
        repository,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while inserting media for page sectionID: ${sectionID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting restaurant media for page sectionID: ${sectionID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default RestaurantProfileMediaService;
