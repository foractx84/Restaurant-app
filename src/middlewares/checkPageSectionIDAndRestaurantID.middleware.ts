import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { NextFunction, Response } from 'express';
import { logger } from '@utils/logger';
import ProfileSectionsModel from '@models/profileSections.model';
import { ProfileSectionEntity } from '@entities/profileSection.entity';
import { ProfilePageEntity } from '@entities/profilePage.entity';
import { CustomRequest } from '@interfaces/CustomRequest.interface';

export const checkPageSectionIDAndRestaurantIDMiddleware = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let pageSectionID = '';
    if (Object.keys(req?.body).length > 0) {
      pageSectionID = req?.body.sectionID;
    } else if (Object.keys(req?.params).length > 0) {
      pageSectionID = req?.params.sectionID;
    }

    if (!pageSectionID || !restaurantID) {
      logger.warn(`Missing ${pageSectionID ? 'restaurantID' : 'sectionID'} in request.`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing ${pageSectionID ? 'restaurantID' : 'sectionID'} in request.`),
      );
    }

    const profileSectionsModel = new ProfileSectionsModel();
    const existingProfileSection: ProfileSectionEntity = await profileSectionsModel.fetchProfilePageSectionByID(parseInt(pageSectionID));

    if (!existingProfileSection) {
      logger.warn(`Profile Page section does not exist with id: ${pageSectionID}.`);
      throw new HttpException(
        404,
        getErrorPayload(
          InternalErrorCode.inputValueNotInDB,
          `Profile Page section does not exist with id: ${pageSectionID}. Please check your value and try again.`,
        ),
      );
    }

    const profilePage: ProfilePageEntity = existingProfileSection.profilePage;
    if (!profilePage || profilePage?.deletedAt != null) {
      logger.warn(`Restaurant does not exist with id: ${restaurantID}.`);
      throw new HttpException(
        404,
        getErrorPayload(
          InternalErrorCode.inputValueNotInDB,
          `Restaurant does not exist with id: ${restaurantID}. Please check your value and try again.`,
        ),
      );
    }

    if (profilePage?.restaurant.restaurant_id !== restaurantID) {
      logger.error(`User is unauthorized from accessing profile page section.`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    req.metadata = profilePage;

    return next();
  } catch (err) {
    return next(err);
  }
};

export default checkPageSectionIDAndRestaurantIDMiddleware;
