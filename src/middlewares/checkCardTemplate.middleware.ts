import { NextFunction, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { CustomRequest } from '@/interfaces/CustomRequest.interface';
import { SECTION_CARD_TEMPLATES } from '@/constants/sectionTemplates.constants';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import ProfileCardsModel from '@/models/profileCards.model';

/**
 * Validates profile page section is a template type that allows for cards
 * Only certain template types allow for media
 */
export const checkCardTemplate = async (req: CustomRequest<ProfileCardsEntity>, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res.locals.restaurantID);

    // get existing profile page if exists on request
    let profileCardEntity: ProfileCardsEntity = req?.metadata;

    // acquire the card either by existing passed up card or via query if no page exists or sectionID doesnt exist for that page
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

    if (!profileCardEntity) {
      const profileCardsModel = new ProfileCardsModel();
      profileCardEntity = await profileCardsModel.fetchPageSectionCardByID(cardID);
    }

    // if card does not exist, throw error
    if (!profileCardEntity) {
      logger.error(`Card does not exist with cardID: ${cardID}.`);
      throw new HttpException(
        404,
        getErrorPayload(InternalErrorCode.inputValueNotInDB, `Card does not exist with cardID: ${cardID}. Please check your value and try again.`),
      );
    }

    // if profile section template does not match allowed types for cards
    if (
      !profileCardEntity.section?.sectionTemplate?.template ||
      !SECTION_CARD_TEMPLATES.includes(profileCardEntity?.section?.sectionTemplate?.template)
    ) {
      logger.error(
        `Card section template type ${profileCardEntity?.section?.sectionTemplate?.template} is incompatible for creating / editing cards.  Allowed section template  types for creating / editing card are ${SECTION_CARD_TEMPLATES}.`,
      );
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.missingInputOrIncorrectType,
          `Card section template type ${profileCardEntity?.section?.sectionTemplate?.template} is incompatible for creating / editing cards.  Allowed section template  types for creating / editing card are ${SECTION_CARD_TEMPLATES}.`,
        ),
      );
    }

    // add catd entity to request object
    req.metadata = profileCardEntity;
    next();
  } catch (err) {
    next(err);
  }
};
