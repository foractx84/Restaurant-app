import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { StripeCustomerModelInterface } from '@interfaces/stripeCustomer.interface';
import { StripeCustomerEntity } from '@entities/stripeCustomer.entity';

class StripeCustomerModel implements StripeCustomerModelInterface {
  insertStripeCustomer = async (stripeCustomerID: string, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.insert(StripeCustomerEntity, {
        stripe_customer_id: stripeCustomerID,
      });
    } catch (err) {
      logger.error(`Error while inserting stripe customer with id: '${stripeCustomerID}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while inserting stripe customer with id: ${stripeCustomerID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default StripeCustomerModel;
