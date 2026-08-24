import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { SubscriptionModelInterface } from '@interfaces/subscription.interface';
import { SubscriptionEntity } from '@entities/subscription.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class SubscriptionModel implements SubscriptionModelInterface {
  getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID = async (
    stripeSubscriptionID: string,
    repository?: EntityManager,
  ): Promise<SubscriptionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository
        .getRepository(SubscriptionEntity)
        .createQueryBuilder('subscriptions')
        .leftJoinAndSelect(
          'subscriptions.subscription_items',
          'subscriptionItems',
          'subscriptionItems.status = :status AND subscriptionItems.deleted_at IS NULL',
          { status: 'active' },
        )
        .where('subscriptions.stripe_subscription_id = :stripeSubscriptionID', { stripeSubscriptionID })
        .andWhere('subscriptions.deleted_at IS NULL')
        .getMany();
    } catch (err) {
      logger.error(`Error occurred while getting subscription and subscription item for stripeSubscriptionID: '${stripeSubscriptionID}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting subscription and subscription item for stripeSubscriptionID: '${stripeSubscriptionID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertSubscription = async (subscription: SubscriptionEntity, repository?: EntityManager): Promise<SubscriptionEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const databaseResult = await customRepository.insert('subscriptions', [subscription]);
      return classToPlain(databaseResult.raw[0]) as SubscriptionEntity;
    } catch (err) {
      logger.error(`Error occurred while inserting subscription: '${JSON.stringify(subscription)}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting subscription: '${JSON.stringify(subscription)}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default SubscriptionModel;
