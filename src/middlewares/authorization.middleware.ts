import jwt, { VerifyErrors } from 'jsonwebtoken';
import { JWT } from '@/configs/config';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { logger } from '@/utils/logger';

/**
 * Verify if JWT token is valid for the request
 * @param {object} permissions Permissions associated with a user
 * @returns {object} null
 */
const authorizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authService = new AuthService(new UsersModel());
  // Return if token wasn't provided.
  if (!req.headers.authorization) {
    logger.warn('Missing authorization token from header');
    throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
  }

  // Return if restaurantid is missing from header
  if (!req.headers.restaurantid) {
    logger.warn('Missing restaurantID from header');
    throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
  }

  //we're going to get the restaurantID and the managerID from the authorization token itself

  let token: string = req.headers.authorization;
  const requestRestaurantID: string = req.headers.restaurantid as string;
  res.locals.restaurantID = requestRestaurantID;

  //in case we pass in a bearer token
  if (token.startsWith('Bearer')) {
    token = token.split(' ')[1];
  }

  jwt.verify(token, JWT.SECRET_KEY, async function (err: VerifyErrors, decoded: any) {
    if (err) {
      logger.warn('JWT could not verify authorization token');
      res.status(401).json({ errors: [getErrorPayload(InternalErrorCode.unauthorizedUser)] });
      return;
    }

    if (decoded.superUser) {
      const isValidSuperUser = await authService.validateSuperUser(decoded.managerID);
      if (isValidSuperUser) {
        res.locals.isSuper = true;
        res.locals.managerID = decoded.managerID;

        next();
        return;
      } else {
        logger.warn(`User is not authorized as super user based on id ${decoded.managerID}.`);
        next(new HttpException(401, [getErrorPayload(InternalErrorCode.unauthorizedUser)]));
        return;
      }
    }

    const isValid = await authService.validateManager(decoded.managerID, parseInt(requestRestaurantID));

    if (!isValid) {
      logger.warn('Manager is not authorized to access restaurant.');
      res.status(401).json({ errors: [getErrorPayload(InternalErrorCode.unauthorizedUser)] });
      return;
    }
    res.locals.managerID = decoded.managerID;
    res.locals.isSuper = false;

    next();
  });
};

export default authorizationMiddleware;
