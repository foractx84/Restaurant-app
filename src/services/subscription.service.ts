import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { SubscriptionModelInterface, SubscriptionServiceInterface } from '@interfaces/subscription.interface';
import Stripe from 'stripe';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { SubscriptionItemServiceInterface } from '@interfaces/subscriptionItem.interface';
import { getCurrentDate } from '@utils/timeUtils';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

class SubscriptionService implements SubscriptionServiceInterface {
  private subscriptionItemService: SubscriptionItemServiceInterface;
  private subscriptionModel: SubscriptionModelInterface;

  constructor(subscriptionItemService: SubscriptionItemServiceInterface, subscriptionModel: SubscriptionModelInterface) {
    this.subscriptionItemService = subscriptionItemService;
    this.subscriptionModel = subscriptionModel;
  }

  createSubscription = async (
    stripeSubscriptionID: string,
    items: Stripe.LineItem[],
    stripeCustomerID: string,
    isPaid: boolean,
    repository?: EntityManager,
  ): Promise<SubscriptionEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      let subscription: SubscriptionEntity = {};
      subscription = await this.subscriptionModel.insertSubscription(
        {
          stripe_subscription_id: stripeSubscriptionID,
          stripe_customer_id: stripeCustomerID,
          started_at: isPaid ? getCurrentDate() : null,
        },
        repository,
      );

      if (items.length > 0) {
        const subscriptionItems = await this.subscriptionItemService.createSubscriptionItems(items, subscription.subscription_id, isPaid, repository);
        subscription.subscription_items = [...subscriptionItems];
      } else {
        subscription.subscription_items = [];
      }

      return subscription;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while creating subscription with id: ${stripeSubscriptionID} for customer with stripeCustomerID: ${stripeCustomerID}. - ${err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating subscription with id: ${stripeSubscriptionID} for customer with stripeCustomerID: ${stripeCustomerID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID = async (
    stripeSubscriptionID: string,
    repository?: EntityManager,
  ): Promise<SubscriptionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const subscriptions: SubscriptionEntity[] = await this.subscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(
        stripeSubscriptionID,
        repository,
      );

      if (!subscriptions) {
        logger.error(`No subscriptions exists for stripeSubscriptionID: ${stripeSubscriptionID}`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `No subscription exists for stripeSubscriptionID: ${stripeSubscriptionID}. Refer to logs for more info.`,
          ),
        );
      }

      return subscriptions;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting subscription and subscription items with stripeSubscriptionID: ${stripeSubscriptionID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting subscription and subscription items with stripeSubscriptionID: ${stripeSubscriptionID}.. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default SubscriptionService;
