import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import RestaurantAddressModel from '@/models/restaurantAddress.model';

/**
 * Verify if Restaurant Address is linked to Restaurant
 */
export const checkRestaurantAddressIDAndRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let restaurantAddressID;
    if (Object.keys(req?.body).length > 0) {
      restaurantAddressID = req?.body?.address?.restaurantAddressID;
    }

    if (!restaurantID) {
      logger.warn('Missing restaurantID in request');
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `restaurantID missing in request`));
    }

    if (restaurantAddressID) {
      const restaurantAddressModel = new RestaurantAddressModel();
      const restaurantAddress = await restaurantAddressModel.fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID(
        parseInt(restaurantAddressID),
        restaurantID,
      );
      if (!restaurantAddress) {
        logger.warn(`Restaurant Address: ${restaurantAddressID} does not exist for restaurant ${restaurantID}`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

export default checkRestaurantAddressIDAndRestaurantIDMiddleware;
