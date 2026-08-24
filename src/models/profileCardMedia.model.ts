import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { ProfileCardMediaModelInterface, RestaurantProfileSectionCardsMediaInterface } from '@/interfaces/profileCardsMedia.interface';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';

class ProfileCardMediaModel implements ProfileCardMediaModelInterface {
  insertProfileCardMedia = async (
    profileCardMedia: RestaurantProfileSectionCardsMediaInterface[] | ProfileCardsMediaEntity[],
    repository?: EntityManager,
  ): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.save(ProfileCardsMediaEntity, profileCardMedia);
    } catch (err) {
      logger.error(
        `Error occurred while inserting profileCardMedia for restaurantProfileSectionCardID: ${profileCardMedia[0].restaurantProfileSectionCardID}. - ` +
          err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting profileCardMedia for restaurantProfileSectionCardID: ${profileCardMedia[0].restaurantProfileSectionCardID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteProfileCardMediaByCardID = async (cardID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.delete(ProfileCardsMediaEntity, { restaurantProfileSectionCardID: cardID });
    } catch (err) {
      logger.warn(`Error deleting profile card media with ID: ${cardID}` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error deleting profile card media with '${cardID}'`));
    }
  };
}

export default ProfileCardMediaModel;
