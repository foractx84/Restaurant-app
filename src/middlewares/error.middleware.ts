import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { HttpException } from '@/exceptions/HttpException';

const errorMiddleware = (errors: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = errors.status || 500;
    if (errors.payload) {
      errors.payload.forEach(error => {
        const param = error.param ? `, Parameter:: ${error.param}` : '';
        logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, InternalCode:: ${error.code}, Message:: ${error.message}` + param);
      });
      res.status(status).json({ errors: errors.payload });
    } else {
      logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${errors}`);
      res.status(status).json({ errors: 'Runtime Error occurred. Refer to logs for more detail.' });
    }
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
