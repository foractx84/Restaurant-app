import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { StripeIdempotenceModelInterface, StripeIdempotenceServiceInterface } from '@interfaces/stripeIdempotence.interface';

class StripeIdempotenceService implements StripeIdempotenceServiceInterface {
  private stripeIdempotenceModel: StripeIdempotenceModelInterface;

  constructor(stripeIdempotenceModel: StripeIdempotenceModelInterface) {
    this.stripeIdempotenceModel = stripeIdempotenceModel;
  }

  checkStripeEventExists = async (eventID: string): Promise<boolean> => {
    try {
      const event = await this.stripeIdempotenceModel.getStripeEventByEventID(eventID);
      return event && Object.keys(event).length > 0;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while checking if stripe event: ${eventID} already exists. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while checking if stripe event: ${eventID} already exists. Refer to logs for more info`,
          ),
        );
      }
    }
  };

  logStripeEvent = async (eventID: string) => {
    try {
      await this.stripeIdempotenceModel.insertStripeEvent(eventID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while logging stripe event: ${eventID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while logging stripe event: ${eventID}. Refer to logs for more info`),
        );
      }
    }
  };
}

export default StripeIdempotenceService;
