import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { ProfileCardsModelInterface, ProfileCardsServiceInterface } from '@/interfaces/profileCards.interface';
import { ProfileCardMediaServiceInterface } from '@/interfaces/profileCardsMedia.interface';

class ProfileCardsService implements ProfileCardsServiceInterface {
  private profileCardsModel: ProfileCardsModelInterface;
  private profileCardMediaService: ProfileCardMediaServiceInterface;

  constructor(profileCardsModel: ProfileCardsModelInterface, profileCardMediaService: ProfileCardMediaServiceInterface) {
    this.profileCardsModel = profileCardsModel;
    this.profileCardMediaService = profileCardMediaService;
  }

  deleteCard = async (cardID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.profileCardsModel.deleteCard(cardID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting profile section card: ${cardID}. - ${err.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting profile section card: ${cardID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  upsertCard = async (card: ProfileCardsEntity, entityManager?: EntityManager): Promise<ProfileCardsEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await this.profileCardsModel.upsertCard(card, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating profile section card: ${JSON.stringify(card)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating profile section card: ${JSON.stringify(card)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  linkMediaToProfileCard = async (mediaID: number, cardID: number): Promise<void> => {
    try {
      await this.profileCardMediaService.linkMediaToProfileCard(mediaID, cardID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking media to profile card: ${cardID}. - ${err.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking media to profile card: ${cardID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };
}

export default ProfileCardsService;
