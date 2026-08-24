import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { StripeCustomerModelInterface, StripeCustomerServiceInterface } from '@interfaces/stripeCustomer.interface';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

class StripeCustomerService implements StripeCustomerServiceInterface {
  private stripeCustomerModel: StripeCustomerModelInterface;

  constructor(stripeCustomerModel: StripeCustomerModelInterface) {
    this.stripeCustomerModel = stripeCustomerModel;
  }

  createStripeCustomer = async (stripeCustomerID: string, repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.stripeCustomerModel.insertStripeCustomer(stripeCustomerID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating stripe customer with customer id: ${stripeCustomerID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating stripe customer with customer id: ${stripeCustomerID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default StripeCustomerService;
