import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { TapManagerErrorPayloadInterface } from '@/interfaces/errors.interface';
import { logger } from '@/utils/logger';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';

const validationMiddleware = (
  type: any,
  value: string | 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
  stopAtFirstError = false,
): RequestHandler => {
  return (req, res, next) => {
    validate(plainToClass(type, req[value]), { skipMissingProperties, whitelist, forbidNonWhitelisted, stopAtFirstError }).then(
      (errors: ValidationError[]) => {
        if (errors.length > 0) {
          const payload: TapManagerErrorPayloadInterface[] = [];
          for (const error of errors) {
            let message = '';
            if (error.constraints === undefined) {
              logger.error(error.toString());
              const errorMessage = findConstraints(error) || [];
              if (errorMessage.length > 0) {
                message = errorMessage.join();
              } else {
                message = `Missing property, Misspelled property or wrong type within object: ${error.property}`;
              }
            } else {
              const constraintsString = Object.values(error.constraints);
              message = constraintsString.join(', ');
            }
            payload.push(getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, message, error.property));
          }
          next(new HttpException(400, payload));
        } else {
          next();
        }
      },
    );
  };
};

// object is nested [{children {children: {children: { children : { ..... : constraints} }}}}]
// we dont want to find "constraints" key recursively because recursion can use a lot of memory on the stack
// so we traverse iteratively until we find it or return empty array
const findConstraints = (error: ValidationError): string[] => {
  try {
    let current = error.children;
    while (current && current.length > 0) {
      if (current[0]['constraints']) {
        return Object.values(current[0]['constraints']) as unknown as string[];
      }
      if (current[0]['children'].length > 0) {
        current = current[0]['children'];
      } else {
        return [];
      }
    }
  } catch (err) {
    logger.error(`Error occurred in findConstraints function with parameter: ${JSON.stringify(error)} - ` + err);
    return [];
  }
};

export default validationMiddleware;
