import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import MediaLibraryModel from '@models/mediaLibrary.model';
import { IMAGE_TYPE_ID } from '@constants/media.constants';
import { LinkMenuItemAndMediaAndThumbnailsInterface } from '@interfaces/menuItemMedia.interface';

/**
 * Verify if multiple mediaIDs is linked to restaurantID
 */
export const checkMultipleMediaIDLinkedToRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    const mediaIDs = [];
    if (Object.keys(req?.body).length > 0) {
      mediaIDs.push(...req?.body.mediaIDs);
    } else if (Object.keys(req?.params).length > 0) {
      mediaIDs.push(...req?.params.mediaIDs.split(', '));
    }

    // might not be necessary if called after dto validation and other middleware, but still good to have
    if (!restaurantID) {
      logger.warn(`Missing restaurantID ${restaurantID} in request`);
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing restaurantID ${restaurantID} in request`));
    }

    const thumbnails: LinkMenuItemAndMediaAndThumbnailsInterface[] = req?.body?.thumbnails;
    // if thumbnails array is passed in request
    if (thumbnails?.length > 0) {
      // check if videoID is in both the mediaIDs array and also in the thumbnails array of objects
      thumbnails.forEach(thumbnail => {
        if (!mediaIDs.includes(thumbnail.videoID)) {
          logger.warn(`Video ID passed in request ${thumbnail.videoID} does not exist in mediaIDs array ${mediaIDs}`);
          throw new HttpException(
            400,
            getErrorPayload(
              InternalErrorCode.missingInputOrIncorrectType,
              `Video ID passed in request ${thumbnail.videoID} does not exist in mediaIDs array ${mediaIDs}`,
            ),
          );
        }
      });

      // add video and thumbnails to mediaIDs in order to check later if they exist for the restaurantID
      if (Object.keys(req?.body).length > 0) {
        thumbnails.forEach(thumbnail => {
          mediaIDs.push(thumbnail.thumbnailID); // dont need to add videoID since its already in mediaIDs and validation check passed
        });
      }
    }

    const mediaModel = new MediaLibraryModel();

    const media = await mediaModel.getMediaByRestaurantID(restaurantID);
    const restaurantMediaIDs = media.map(_media => _media.media_id);
    if (!mediaIDs.every(mediaID => restaurantMediaIDs.includes(mediaID))) {
      logger.warn(`Some media ${JSON.stringify(mediaIDs)}} does not exist for restaurant ${restaurantID}`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    // check if thumbnails are of type image
    if (thumbnails?.length > 0) {
      thumbnails.forEach(thumbnail => {
        const _media = media?.find(_media => _media.media_id === thumbnail.thumbnailID);
        if (_media.media_type_id !== IMAGE_TYPE_ID) {
          logger.warn(`MediaID ${thumbnail.thumbnailID} is not an image type`);
          throw new HttpException(
            400,
            getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `MediaID ${thumbnail.thumbnailID} is not an image type`),
          );
        }
      });
    }

    res.locals.media = media;

    return next();
  } catch (err) {
    return next(err);
  }
};

export default checkMultipleMediaIDLinkedToRestaurantIDMiddleware;
