import { NextFunction, Request, Response } from 'express-serve-static-core';
import MenuItemModel from '@/models/menuItem.model';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';

/**
 * Validates menu item being accessed/modified exists for restaurant provided in header
 * Only authorized restaurants will be able to access these items
 */
export const checkMenuItemIDAndRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menuItemModel = new MenuItemModel();
    let id = '';
    if (Object.keys(req?.body).length > 0) {
      id = req?.body.menuItemID;
    } else if (Object.keys(req?.params).length > 0) {
      id = req?.params.menuItemID;
    }

    const restaurantID = parseInt(res.locals.restaurantID);

    if (!id || !restaurantID) {
      logger.warn(`Missing ${id ? 'restaurantID' : 'menuID'} in request`);
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `menuItemID or restaurantID missing in request`));
    }

    const menuItem = await menuItemModel.findMenuItemByIDAndRestaurantID(parseInt(id), restaurantID);
    if (!menuItem) {
      logger.error(`User is unauthorized from accessing menu item.`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    next();
  } catch (err) {
    next(err);
  }
};
