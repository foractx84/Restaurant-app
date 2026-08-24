import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import MediaLibraryModel from '@/models/mediaLibrary.model';

/**
 * Verify if mediaID is linked to restaurantID
 */
export const checkMediaIDLinkedToRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let mediaID = '';
    if (Object.keys(req?.body).length > 0) {
      mediaID = req?.body.mediaID;
    } else if (Object.keys(req?.params).length > 0) {
      mediaID = req?.params.mediaID;
    }

    // might not be necessary if called after dto validation and other middleware, but still good to have
    if (!mediaID || !restaurantID) {
      logger.warn(`Missing ${mediaID ? 'restaurantID' : 'mediaID'} in request`);
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `mediaID or restaurantID missing in request`));
    }

    const mediaModel = new MediaLibraryModel();
    const restaurantMediaIDs = (await mediaModel.getMediaByRestaurantID(restaurantID)).map(media => media.media_id);
    if (!restaurantMediaIDs.includes(parseInt(mediaID))) {
      logger.warn(`Media ${mediaID} does not exist for restaurant ${restaurantID}`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default checkMediaIDLinkedToRestaurantIDMiddleware;
