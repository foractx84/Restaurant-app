import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { JWT } from '@/configs/config';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';

const parseTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authService = new AuthService(new UsersModel());
  if (!req.headers.authorization) {
    logger.warn('Missing authorization token from header');
    throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
  }

  let token: string = req.headers.authorization;

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

    res.locals.managerID = decoded.managerID;
    res.locals.isSuper = false;

    next();
  });
};

export default parseTokenMiddleware;
