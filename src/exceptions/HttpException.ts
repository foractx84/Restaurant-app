import { TapManagerErrorPayloadInterface } from '@/interfaces/errors.interface';

class HttpException extends Error {
  public status: number;
  public payload: TapManagerErrorPayloadInterface[];

  constructor(status: number, payload: TapManagerErrorPayloadInterface | TapManagerErrorPayloadInterface[]) {
    super();
    this.status = status;
    if (!Array.isArray(payload)) {
      this.payload = [payload];
    } else {
      this.payload = payload;
    }
  }
}

class TapManagerError implements TapManagerErrorPayloadInterface {
  code: number; // Internal 4-digit error code for use on client apps
  message: string;
  param?: string;

  constructor(code: number, message: string, param?: string) {
    this.code = code;
    this.message = message;
    this.param = param;
  }
}

const enum InternalErrorCode {
  unauthorizedUser, // for authentication, we do not want to be very specific about the error in case we run into some bad actors trying to take advantage of our system.
  missingInputOrIncorrectType,
  authorizationTokenInvalid,
  inputValueNotInDB, // input value is not in DB
  databaseError,
  resourceConflict, // unique value already exists
  runtimeError,
  imageUploadError,
  stripeException,
  unprocessableContent,
  badGateway,
}

/**
 * Makes the error payload JSON to return in the body of the response for errors.
 * For more details go here: https://github.com/taptabapp/API-Documentation/blob/master/API-Error-Codes.md
 * @param code internal TapTab 4-digit error code to be used by clients to parse and display an error message that a non-technical user can understand
 * @returns error data payload
 */
function getErrorPayload(code: InternalErrorCode, message?: string, param?: string): TapManagerError {
  switch (code) {
    case InternalErrorCode.imageUploadError:
      return new TapManagerError(1222, message, param);
    case InternalErrorCode.missingInputOrIncorrectType:
      return new TapManagerError(2222, message, param);
    case InternalErrorCode.inputValueNotInDB:
      return new TapManagerError(3330, message, param);
    case InternalErrorCode.unprocessableContent:
      return new TapManagerError(4420, message, param);
    case InternalErrorCode.authorizationTokenInvalid:
      return new TapManagerError(4443, 'Authorization Token Invalid', param);
    case InternalErrorCode.unauthorizedUser:
      return new TapManagerError(4444, 'User is not authorized', param);
    case InternalErrorCode.databaseError:
      return new TapManagerError(3332, message, param);
    case InternalErrorCode.resourceConflict:
      return new TapManagerError(3336, message, param);
    case InternalErrorCode.runtimeError:
      return new TapManagerError(3337, message, param);
    case InternalErrorCode.stripeException:
      return new TapManagerError(5000, message, param);
  }
}

export { HttpException, TapManagerError, InternalErrorCode, getErrorPayload };
