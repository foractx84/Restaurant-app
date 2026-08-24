import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { ProfileCardsModelInterface } from '@/interfaces/profileCards.interface';

class ProfileCardsModel implements ProfileCardsModelInterface {
  fetchPageSectionCardByID = async (cardID: number): Promise<ProfileCardsEntity> => {
    try {
      const ormConn = await ormConnection();
      return await ormConn.findOne(ProfileCardsEntity, {
        where: { restaurantProfileSectionCardID: cardID },
        relations: ['section', 'section.profilePage', 'section.sectionTemplate'],
      });
    } catch (err) {
      logger.error(`Error fetching profile section card entity by cardID: ${cardID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error fetching profile section card entity by cardID: ${cardID}. - ${err.stack || err}}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteCard = async (cardID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      // ON DELETE CASCADE deletes ProfileCardsMediaEntity if any rows exist
      // ProfileCardsEntity < - > ProfileCardsMediaEntity < - > MediaLibraryEntity

      await repository.delete(ProfileCardsEntity, { restaurantProfileSectionCardID: cardID });
    } catch (err) {
      logger.error(`Error deleting profile section card: ${cardID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error deleting profile section card: ${cardID}. Refer to logs for more info.`),
      );
    }
  };

  upsertCard = async (cardEntity: ProfileCardsEntity, repository?: EntityManager): Promise<ProfileCardsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.save(ProfileCardsEntity, cardEntity);
    } catch (err) {
      logger.error(`Error upserting profile section card entity: ${cardEntity}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error upserting profile section card entity: ${cardEntity}. Refer to logs for more info.`),
      );
    }
  };
}

export default ProfileCardsModel;
