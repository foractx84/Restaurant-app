import { TapManagerErrorPayloadInterface } from '@/interfaces/errors.interface';
import { HttpException } from './HttpException';

class StripeException extends HttpException {
  constructor(status: number, payload: TapManagerErrorPayloadInterface | TapManagerErrorPayloadInterface[]) {
    super(status, payload);
  }
}

class StripeError implements TapManagerErrorPayloadInterface {
  code: number;
  message: string;
  param?: string;

  constructor(code: number, message: string, param?: string) {
    this.code = code;
    this.message = message;
    this.param = param;
  }
}

function getStripeErrorPayload(code: StripeRawErrorType, message?: string, param?: string): StripeError {
  switch (code) {
    case StripeRawErrorType.invalid_request_error:
      return new StripeError(500, message, param);
    default:
      return new StripeError(500, message, param);
  }
}

enum StripeRawErrorType {
  'card_error', // A declined card error, e.g. "Your card's expiration year is invalid."
  'invalid_request_error', // Invalid parameters were supplied to Stripe's API
  'api_error', // An error occurred internally with Stripe's API
  'idempotency_error', // An idempotency key was used improperly
  'rate_limit_error', // Too many requests hit the API too quickly
  'authentication_error', // You probably used an incorrect API key
  'invalid_grant',
}

export { StripeException, StripeError, getStripeErrorPayload, StripeRawErrorType };
