import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import MenuSectionsModel from '@/models/menuSections.model';

/**
 * Verify if Menu is linked to Restaurant
 */
export const menuSectionLinkedToRestaurantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let menuSectionID = '';
    if (Object.keys(req?.body).length > 0) {
      menuSectionID = req?.body.menuSectionID;
    } else if (Object.keys(req?.params).length > 0) {
      menuSectionID = req?.params.menuSectionID;
    }

    // might not be necessary if called after dto validation and other middleware, but still good to have
    if (!menuSectionID || !restaurantID) {
      logger.warn(`Missing ${menuSectionID ? 'restaurantID' : 'menuSectionID'} in request`);
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `menuID or restaurantID missing in request`));
    }

    const menuSectionModel = new MenuSectionsModel();
    const menuSectionExists = await menuSectionModel.findMenuSectionByIDAndRestaurantID(parseInt(menuSectionID), restaurantID);
    if (!menuSectionExists) {
      logger.warn(`menuSectionID ${menuSectionID} does not exist for restaurant ${restaurantID}`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default menuSectionLinkedToRestaurantMiddleware;
