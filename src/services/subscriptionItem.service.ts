import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import Stripe from 'stripe';
import { ProductPriceServiceInterface } from '@interfaces/productPrice.interface';
import { SubscriptionItemModelInterface, SubscriptionItemServiceInterface } from '@interfaces/subscriptionItem.interface';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import { ProductPriceEntity } from '@/entities/productPrice.entity';
import { getCurrentDate, getCurrentPlusTime } from '@utils/timeUtils';
import { SubscriptionStatus } from '@/enums/subscriptionStatus';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { PaymentPlan, PaymentPlanMapper } from '@/enums/paymentPlan';

class SubscriptionItemService implements SubscriptionItemServiceInterface {
  private productPriceService: ProductPriceServiceInterface;
  private subscriptionItemModel: SubscriptionItemModelInterface;

  constructor(productPriceService: ProductPriceServiceInterface, subscriptionItemModel: SubscriptionItemModelInterface) {
    this.productPriceService = productPriceService;
    this.subscriptionItemModel = subscriptionItemModel;
  }

  createSubscriptionItems = async (
    items: Stripe.LineItem[],
    subscriptionID: number,
    isPaid: boolean,
    repository?: EntityManager,
  ): Promise<SubscriptionItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const subscriptionItems: SubscriptionItemEntity[] = [];
      for (const item of items) {
        const productPrice: ProductPriceEntity = await this.productPriceService.getProductPriceByStripePriceID(item.price.id);

        const paymentPlan = productPrice.payment_plan_id?.['name'];
        const subscriptionItem: SubscriptionItemEntity = {
          subscription_id: subscriptionID,
          package_id: productPrice.product_id?.['package_id'],
          amount: item.amount_subtotal,
          expiration_date: isPaid ? getCurrentPlusTime(paymentPlan) : null,
          tax_amount: item.amount_tax,
          status: isPaid ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
          stripe_subscription_item_id: item.id,
          price_id: productPrice.product_price_id,
        };

        subscriptionItems.push(subscriptionItem);
      }

      return await this.subscriptionItemModel.insertSubscriptionItems(subscriptionItems, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating subscription items: ${items.toString()}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating subscription items: ${items.toString()}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  cancelSubscriptionItems = async (subscriptionItemIDs: string[], repository?: EntityManager): Promise<SubscriptionItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.subscriptionItemModel.cancelSubscriptionItems(subscriptionItemIDs, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while setting subscription items to cancelled: ${JSON.stringify(subscriptionItemIDs)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting subscription items to cancelled: ${JSON.stringify(subscriptionItemIDs)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getSubscriptionItemByStripeCustomerIDAndPackageID = async (
    stripeCustomerID: string,
    packageID: number,
    repository?: EntityManager,
  ): Promise<SubscriptionItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await this.subscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID(stripeCustomerID, packageID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while fetching subscription items by stripe customer id: ${stripeCustomerID} and package id: ${packageID}. - ${err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching subscription items by stripe customer: ${stripeCustomerID} and package id: ${packageID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  setExpirationDateSubscriptionItems = async (items: Stripe.InvoiceLineItem[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      for (const item of items) {
        // "recurring": {
        //   "aggregate_usage": null,
        //   "interval": "month",
        //   "interval_count": 1,
        //   "trial_period_days": null,
        //   "usage_type": "licensed"
        // },
        // where interval = month, year, week, or day
        // https://stripe.com/docs/api/prices/object#price_object-recurring-aggregate_usage

        const paymentPlan = PaymentPlanMapper[item?.price?.recurring?.interval] || PaymentPlan.ONE_TIME;
        await this.subscriptionItemModel.updateExpirationDateSubscriptionItems(item.subscription_item, paymentPlan, repository);
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while setting expiration date subscription items: ${items.toString()}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting setting expiration date subscription items: ${items.toString()}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  updateSubscriptionItem = async (
    subscriptionItem: SubscriptionItemEntity,
    restaurantPackageID: number,
    repository?: EntityManager,
  ): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.subscriptionItemModel.updateSubscriptionItem(
        { ...subscriptionItem, restaurant_package_id: restaurantPackageID, assigned_at: getCurrentDate() },
        repository,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while updating subscription item: ${subscriptionItem.toString()}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while updating subscription item: ${subscriptionItem.toString()}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default SubscriptionItemService;
