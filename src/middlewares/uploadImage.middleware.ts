import { NextFunction, Request, Response } from 'express-serve-static-core';
import multer from 'multer';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';

const parseMulterErrors = (err: Error, next: NextFunction) => {
  try {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      logger.error(`Error occurred during multer image upload. - ${err.message}`);
      if (err.code === 'LIMIT_FILE_SIZE') {
        throw new HttpException(
          413,
          getErrorPayload(InternalErrorCode.imageUploadError, `Error occurred during multer image upload with field: ${err.field}. - ${err.message}`),
        );
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.imageUploadError, `Error occurred during multer image upload with field: ${err.field}. - ${err.message}`),
        );
      } else {
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.imageUploadError, `Error occurred during multer image upload with field: ${err.field}. - ${err.message}`),
        );
      }
    } else if (err) {
      logger.error(`Error occurred during image upload. - ${err.message}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.imageUploadError, `Error occurred during image upload. - ${err.message}`));
    }
    return;
  } catch (err) {
    next(err);
  }
};

export const uploadImageMiddleware = (upload: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, err => {
      // access to parseMulterErrors from closure
      parseMulterErrors(err, next);
      next();
    });
  };
};
