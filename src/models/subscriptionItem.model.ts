import { EntityManager } from 'typeorm';
import { ormConnection, rawQuery } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { SubscriptionItemModelInterface } from '@interfaces/subscriptionItem.interface';
import { SubscriptionItemEntity } from '@entities/subscriptionItem.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';
import { SubscriptionEntity } from '@entities/subscription.entity';
import { getCurrentPlusTime } from '@utils/timeUtils';

class SubscriptionItemModel implements SubscriptionItemModelInterface {
  getSubscriptionItemByStripeCustomerIDAndPackageID = async (
    stripeCustomerID: string,
    packageID: number,
    repository?: EntityManager,
  ): Promise<SubscriptionItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const subscriptions: SubscriptionEntity[] = await repository
        .getRepository(SubscriptionEntity)
        .createQueryBuilder('subscriptions')
        .leftJoinAndSelect(
          'subscriptions.subscription_items',
          'subscriptionItems',
          'subscriptionItems.restaurant_package_id IS NULL AND subscriptionItems.assigned_at IS NULL AND subscriptionItems.deleted_at IS NULL AND subscriptionItems.package_id = :packageID',
          { packageID },
        )
        .where('subscriptions.stripe_customer_id = :stripeCustomerID', { stripeCustomerID })
        .andWhere('subscriptions.deleted_at IS NULL')
        .getMany();

      const filteredSubscriptions: SubscriptionEntity[] = subscriptions.filter(sub => sub.subscription_items.length > 0);
      return filteredSubscriptions[0].subscription_items;
    } catch (err) {
      logger.error(
        `Error occurred while getting subscription items by stripe customer id: '${stripeCustomerID} and package id: ${packageID}.' - ` + err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting subscription items by stripe customer id: '${stripeCustomerID} and package id: ${packageID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertSubscriptionItems = async (subscriptionItems: SubscriptionItemEntity[], repository?: EntityManager): Promise<SubscriptionItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const databaseResult = await customRepository.insert('subscription_items', subscriptionItems);
      return classToPlain(databaseResult.raw) as SubscriptionItemEntity[];
    } catch (err) {
      logger.error(`Error occurred while inserting subscription items: '${JSON.stringify(subscriptionItems)}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting subscription items: '${JSON.stringify(subscriptionItems)}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  updateExpirationDateSubscriptionItems = async (stripeSubscriptionItemID: string, paymentPlan: string, repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const newExpirationDate = getCurrentPlusTime(paymentPlan);

      await repository
        .createQueryBuilder()
        .update(SubscriptionItemEntity)
        .set({ expiration_date: newExpirationDate })
        .where({ stripe_subscription_item_id: stripeSubscriptionItemID })
        .execute();
    } catch (err) {
      logger.error(
        `Error occurred while updating ${paymentPlan} expiration date for subscription items: '${JSON.stringify(stripeSubscriptionItemID)}' - ` + err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating ${paymentPlan} expiration date for subscription items to be cancelled: '${JSON.stringify(
            stripeSubscriptionItemID,
          )}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  updateSubscriptionItem = async (subscriptionItem: SubscriptionItemEntity, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(
        SubscriptionItemEntity,
        { subscription_item_id: subscriptionItem.subscription_item_id },
        { restaurant_package_id: subscriptionItem.restaurant_package_id, assigned_at: subscriptionItem.assigned_at },
      );
    } catch (err) {
      logger.error(`Error occurred while updating subscription item: '${JSON.stringify(subscriptionItem)}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating subscription item: '${JSON.stringify(subscriptionItem)}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  cancelSubscriptionItems = async (stripeSubscriptionItemIDs: string[], repository?: EntityManager): Promise<SubscriptionItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      // Had issues with .save() on an id that is a string and not the primary key.  Same with .update().  QueryBuilder it was difficult to return the raw response result.  Figure to just use raw sql for now.
      const subscriptionItemsQuery = `UPDATE subscription_items SET status = 'cancelled' WHERE stripe_subscription_item_id IN(:...stripeSubscriptionItemIDs) RETURNING *`;
      return (
        await rawQuery<SubscriptionItemEntity[]>(subscriptionItemsQuery, { stripeSubscriptionItemIDs }, repository)
      )[0] as unknown as SubscriptionItemEntity[];
    } catch (err) {
      logger.error(`Error occurred while cancelling subscription items: '${JSON.stringify(stripeSubscriptionItemIDs)}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while cancelling subscription items: '${JSON.stringify(stripeSubscriptionItemIDs)}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default SubscriptionItemModel;
