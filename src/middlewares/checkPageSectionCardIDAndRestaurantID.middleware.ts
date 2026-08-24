import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { NextFunction, Response } from 'express';
import { logger } from '@utils/logger';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import ProfileCardsModel from '@/models/profileCards.model';

export const checkPageSectionCardIDAndRestaurantID = async (req: CustomRequest<ProfileCardsEntity>, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res.locals.restaurantID);

    // acquire the profile section card either by existing passed up page or via query if no page exists or sectionID doesnt exist for that page
    let profileCard: ProfileCardsEntity;
    let cardID: number;
    if (Object.keys(req?.body).length > 0) {
      cardID = req?.body.cardID;
    } else if (Object.keys(req?.params).length > 0) {
      cardID = parseInt(req?.params.cardID);
    }

    if (!cardID || !restaurantID) {
      logger.error(`Missing ${cardID ? 'restaurantID' : 'cardID'} in request.`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing ${cardID ? 'restaurantID' : 'cardID'} in request.`),
      );
    }

    if (!profileCard) {
      const profileCardsModel = new ProfileCardsModel();
      profileCard = await profileCardsModel.fetchPageSectionCardByID(cardID);
    }

    if (!profileCard) {
      logger.error(`Section card does not exist with cardID: ${cardID}.`);
      throw new HttpException(
        404,
        getErrorPayload(
          InternalErrorCode.inputValueNotInDB,
          `Section card does not exist with cardID: ${cardID}. Please check your value and try again.`,
        ),
      );
    }

    if (profileCard.section.profilePage.restaurantID !== restaurantID) {
      logger.error(`Profile card ${cardID} does not exist with restaurantID: ${restaurantID}.`);
      throw new HttpException(
        404,
        getErrorPayload(
          InternalErrorCode.inputValueNotInDB,
          `Profile card ${cardID} does not exist with restaurantID: ${restaurantID}. Please check your value and try again.`,
        ),
      );
    }

    // add card entity to middleware metadata
    req.metadata = profileCard;

    return next();
  } catch (err) {
    return next(err);
  }
};

export default checkPageSectionCardIDAndRestaurantID;
