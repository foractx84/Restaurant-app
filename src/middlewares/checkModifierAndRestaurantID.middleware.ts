import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ModifierModel from '@/models/modifier.model';

export const checkModifierAndRestaurantIDMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    let modifierID: number;
    if (Object.keys(req?.body).length > 0) {
      modifierID = req?.body?.modifierID;
    } else if (Object.keys(req?.params).length > 0) {
      modifierID = parseInt(req?.params?.modifierID);
    }

    if (!restaurantID) {
      logger.error('Missing restaurantID in request');
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `restaurantID missing in request`));
    }

    if (modifierID) {
      const modifierModel = new ModifierModel();
      const modifier = await modifierModel.fetchModifierByID(modifierID);

      if (!modifier) {
        logger.error(`Modifier: ${modifierID} does not exist.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Modifier: ${modifierID} does not exist.`));
      }

      if (modifier.restaurantID !== restaurantID) {
        logger.error(`Modifier: ${modifierID} does not exist for restaurant ${restaurantID}.`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
      }

      res.locals.modifier = modifier;
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
