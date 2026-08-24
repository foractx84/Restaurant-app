import { ModifierEntity } from '@/entities/modifier.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import ModifiersModel from '@/models/modifier.model';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

/**
 * Validates modifiers being accessed/modified exists for restaurant provided in header
 * Only authorized restaurants will be able to access these items
 */
export const modifiersLinkedToRestaurantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modifiersModel = new ModifiersModel();
    let modifierIDs: number[];
    if (Object.keys(req?.body).length > 0) {
      modifierIDs = req?.body?.modifierIDs;
    }

    const restaurantID = parseInt(res.locals.restaurantID);

    if (!modifierIDs || !modifierIDs?.length || !restaurantID) {
      logger.warn(`Missing ${modifierIDs ? 'restaurantID' : 'modifierIDs'} in request`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `modifierID(s) or restaurantID missing in request`),
      );
    }

    if (modifierIDs?.length) {
      const currentModifierEntities: ModifierEntity[] = await modifiersModel.findModifiersByRestaurantID(restaurantID);
      const currentModifierIDs: number[] = currentModifierEntities?.map(modifier => modifier.modifierID);

      for (const modifier of modifierIDs) {
        if (!currentModifierEntities || !currentModifierIDs || !currentModifierIDs.includes(modifier)) {
          logger.error(`User is unauthorized from accessing modifiers.`);
          throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
        }
      }

      res.locals.modifiersBeingLinked = currentModifierEntities
        ?.filter(modifier => modifierIDs.includes(modifier?.modifierID))
        ?.map(modifier => {
          return {
            ...modifier.toResponse(),
          };
        });
    }
    next();
  } catch (err) {
    next(err);
  }
};
