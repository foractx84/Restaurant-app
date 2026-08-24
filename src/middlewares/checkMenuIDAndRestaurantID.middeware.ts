import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import MenusModel from '@/models/menus.model';
import MenuHoursService from '@/services/menuHours.service';
import MenuHoursModel from '@/models/menuHours.model';
import MenuSectionsService from '@/services/menuSections.service';
import MenuSectionsModel from '@/models/menuSections.model';
import MenuDisclaimersService from '@/services/menuDisclaimers.service';
import MenuDisclaimerModel from '@/models/menuDisclaimers.model';
import SoftDeleteService from '@/services/softDelete.service';
import SoftDeleteModel from '@/models/softDelete.model';

/**
 * Verify if Menu is linked to Restaurant
 */
export const menuLinkedToRestaurantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let menuID = '';
    if (Object.keys(req?.body).length > 0) {
      menuID = req?.body.menuID;
    } else if (Object.keys(req?.params).length > 0) {
      menuID = req?.params.menuID;
    }

    // might not be necessary if called after dto validation and other middleware, but still good to have
    if (!menuID || !restaurantID) {
      logger.warn(`Missing ${menuID ? 'restaurantID' : 'menuID'} in request`);
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `menuID or restaurantID missing in request`));
    }

    const menuModel = new MenusModel(
      new MenuHoursService(new MenuHoursModel()),
      new MenuSectionsService(new MenuSectionsModel()),
      new MenuDisclaimersService(new MenuDisclaimerModel()),
      new SoftDeleteService(new SoftDeleteModel()),
    );
    const menuExists = await menuModel.getMenuByMenuIDAndRestaurantID(parseInt(menuID), restaurantID);
    if (!menuExists) {
      logger.warn(`Menu ${menuID} does not exist for restaurant ${restaurantID}`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default menuLinkedToRestaurantMiddleware;
