import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ModifierGroupModel from '@/models/modifierGroup.model';

export const checkModifierGroupAndRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let modifierGroupID: number;
    if (Object.keys(req?.body).length > 0) {
      modifierGroupID = req?.body?.modifierGroupID;
    } else if (Object.keys(req?.params).length > 0) {
      modifierGroupID = parseInt(req?.params?.modifierGroupID);
    }

    if (!restaurantID) {
      logger.error('Missing restaurantID in request');
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `restaurantID missing in request`));
    }

    if (modifierGroupID) {
      const modifierGroupModel = new ModifierGroupModel();
      const modifierGroup = await modifierGroupModel.fetchModifierGroupByID(modifierGroupID);

      if (!modifierGroup) {
        logger.error(`Modifier Group: ${modifierGroupID} does not exist.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Modifier Group: ${modifierGroupID} does not exist.`));
      }

      if (modifierGroup.restaurantID !== restaurantID) {
        logger.error(`Modifier Group: ${modifierGroupID} does not exist for restaurant ${restaurantID}.`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
      }

      res.locals.modifierGroup = modifierGroup;
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
