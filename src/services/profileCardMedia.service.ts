import { ProfileCardMediaServiceInterface, ProfileCardMediaModelInterface } from '@/interfaces/profileCardsMedia.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';

class ProfileCardMediaService implements ProfileCardMediaServiceInterface {
  private profileCardMediaModel: ProfileCardMediaModelInterface;

  constructor(profileCardMediaModel: ProfileCardMediaModelInterface) {
    this.profileCardMediaModel = profileCardMediaModel;
  }

  linkMediaToProfileCard = async (mediaID: number, cardID: number): Promise<void> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.profileCardMediaModel.deleteProfileCardMediaByCardID(cardID, conn);

        if (mediaID) {
          await this.profileCardMediaModel.insertProfileCardMedia([{ mediaID: mediaID, restaurantProfileSectionCardID: cardID }], conn);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking profile card - media. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while linking profile card - media. Refer to logs for more info.`),
        );
      }
    }
  };
}

export default ProfileCardMediaService;
