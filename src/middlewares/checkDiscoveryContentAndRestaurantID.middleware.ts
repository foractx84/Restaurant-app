import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import DiscoveryContentModel from '@models/discoveryContent.model';

export const checkDiscoveryContentAndRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let discoveryContentID: number;
    if (Object.keys(req?.body).length > 0) {
      discoveryContentID = req?.body?.discoveryContentID;
    } else if (Object.keys(req?.params).length > 0) {
      discoveryContentID = parseInt(req?.params?.discoveryContentID);
    }

    if (!restaurantID) {
      logger.warn('Missing restaurantID in request');
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `restaurantID missing in request`));
    }

    if (discoveryContentID) {
      const discoveryContentModel = new DiscoveryContentModel();
      const discoveryContent = await discoveryContentModel.fetchDiscoveryContentByID(discoveryContentID);

      if (!discoveryContent) {
        logger.warn(`Discovery Content: ${discoveryContentID} does not exist.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Discovery Content: ${discoveryContentID} does not exist.`),
        );
      }

      if (discoveryContent.restaurantID !== restaurantID) {
        logger.warn(`Discovery Content: ${discoveryContentID} does not exist for restaurant ${restaurantID}.`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
      }

      res.locals.discoveryContent = discoveryContent;
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
