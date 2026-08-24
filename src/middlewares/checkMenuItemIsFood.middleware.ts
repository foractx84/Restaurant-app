import { NextFunction, Request, Response } from 'express-serve-static-core';
import MenuItemModel from '@/models/menuItem.model';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { Category } from '@/enums/category';

/**
 * Validates that the menu item id provided is of the category 'food'.
 * This should be considered a temporary middleware until we break out drink items from the menu item database table
 */
export const checkMenuItemIsFoodMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
    if (menuItem?.category !== Category.FOOD) {
      logger.error(`Menu Item provided: ${id} is not a food item when one is required.`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menu Item provided: ${id} is not a food item when one is required.`),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
