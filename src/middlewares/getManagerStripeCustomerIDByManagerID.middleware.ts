import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import ManagersModel from '@/models/managers.model';
import { ManagerEntity } from '@/entities/manager.entity';

/**
 * Grab stripe customer id of manager entity by managerID
 */
export const getManagerStripeCustomerIDByManagerID = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerID = parseInt(res?.locals?.managerID);

    // Im assuming for MVP that we will have only have users with managerID based on comments
    // token is required now, so throw error if no managerID
    if (!managerID) {
      logger.warn('Missing managerID in token');
      throw new HttpException(401, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing managerID in token`));
    }

    const managerModel = new ManagersModel();
    const manager: ManagerEntity = await managerModel.getManagerEntityByID(managerID);
    if (manager && manager.stripe_customer_id) {
      res.locals.stripeCustomerID = manager.stripe_customer_id;
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default getManagerStripeCustomerIDByManagerID;
