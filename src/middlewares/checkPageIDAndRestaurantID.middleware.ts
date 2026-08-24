import { NextFunction, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ProfilePagesModel from '@/models/profilePages.model';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { CustomRequest } from '@interfaces/CustomRequest.interface';

/**
 * Validates profile page being accessed/modified exists for restaurant provided in header
 * Only authorized restaurants will be able to access these pages
 */
export const checkPageIDAndRestaurantIDMiddleware = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => {
  try {
    const profilePagesModel = new ProfilePagesModel();
    let id = '';
    if (Object.keys(req?.body).length > 0) {
      id = req?.body.pageID;
    } else if (Object.keys(req?.params).length > 0) {
      id = req?.params.pageID;
    }

    const restaurantID = parseInt(res.locals.restaurantID);

    if (!id || !restaurantID) {
      logger.error(`Missing ${id ? 'restaurantID' : 'pageID'} in request.`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing ${id ? 'restaurantID' : 'pageID'} in request.`),
      );
    }

    const profilePage: ProfilePageEntity = await profilePagesModel.fetchProfilePageByPageID(parseInt(id));
    if (!profilePage) {
      logger.error(`Page does not exist with id: ${id}.`);
      throw new HttpException(
        404,
        getErrorPayload(InternalErrorCode.inputValueNotInDB, `Page does not exist with id: ${id}. Please check your value and try again.`),
      );
    }

    if (profilePage.restaurantID !== restaurantID) {
      logger.error(`User is unauthorized from accessing profile page.`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    // add page entity to request object
    req.metadata = profilePage;
    next();
  } catch (err) {
    next(err);
  }
};
