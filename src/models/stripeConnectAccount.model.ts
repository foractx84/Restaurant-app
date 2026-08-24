import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { StripeConnectAccountModelInterface } from '@interfaces/stripeConnectAccount.interface';
import { StripeConnectAccountEntity } from '@entities/stripeConnectAccount.entity';

class StripeConnectAccountModel implements StripeConnectAccountModelInterface {
  insertStripeConnectAccount = async (
    entity: import('@interfaces/stripeConnectAccount.interface').StripeConnectAccountEntityInterface,
    repository?: EntityManager,
  ): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const now = new Date().toISOString();
      await repository.getRepository(StripeConnectAccountEntity).insert({
        restaurant_id: entity.restaurant_id,
        stripe_account_id: entity.stripe_account_id,
        charges_enabled: entity.charges_enabled,
        details_submitted: entity.details_submitted,
        onboarding_status: entity.onboarding_status,
        capabilities: entity.capabilities as Record<string, unknown>,
        raw_account: entity.raw_account as Record<string, unknown>,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      logger.error(`Error while inserting stripe connect account for restaurant ${entity.restaurant_id}: ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while inserting stripe connect account for restaurant ${entity.restaurant_id}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  findByRestaurantId = async (
    restaurantId: number,
    repository?: EntityManager,
  ): Promise<import('@interfaces/stripeConnectAccount.interface').StripeConnectAccountEntityInterface | null> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const row = await repository.getRepository(StripeConnectAccountEntity).findOne({
        where: { restaurant_id: restaurantId },
      });
      return row ?? null;
    } catch (err) {
      logger.error(`Error while finding stripe connect account by restaurant id ${restaurantId}: ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while finding stripe connect account for restaurant ${restaurantId}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  findByStripeAccountId = async (
    stripeAccountId: string,
    repository?: EntityManager,
  ): Promise<import('@interfaces/stripeConnectAccount.interface').StripeConnectAccountEntityInterface | null> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const row = await repository.getRepository(StripeConnectAccountEntity).findOne({
        where: { stripe_account_id: stripeAccountId },
      });
      return row ?? null;
    } catch (err) {
      logger.error(`Error while finding stripe connect account by stripe account id ${stripeAccountId}: ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while finding stripe connect account by stripe account id. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default StripeConnectAccountModel;
