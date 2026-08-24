import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { StripeServiceInterface } from '@interfaces/stripe.interface';
import { RestaurantsModelInterface } from '@interfaces/restaurants.interface';
import { StripeConnectAccountModelInterface } from '@interfaces/stripeConnectAccount.interface';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

export interface CreateConnectedAccountForRestaurantResult {
  account_id: string;
  onboarding_url: string;
}

export interface StripeConnectServiceInterface {
  createConnectedAccountForRestaurant(restaurantId: number): Promise<CreateConnectedAccountForRestaurantResult>;
  linkExistingConnectAccount(restaurantId: number, stripeAccountId: string): Promise<void>;
}

export class StripeConnectService implements StripeConnectServiceInterface {
  private stripeService: StripeServiceInterface;
  private restaurantsModel: RestaurantsModelInterface;
  private stripeConnectAccountModel: StripeConnectAccountModelInterface;

  constructor(
    stripeService: StripeServiceInterface,
    restaurantsModel: RestaurantsModelInterface,
    stripeConnectAccountModel: StripeConnectAccountModelInterface,
  ) {
    this.stripeService = stripeService;
    this.restaurantsModel = restaurantsModel;
    this.stripeConnectAccountModel = stripeConnectAccountModel;
  }

  async createConnectedAccountForRestaurant(restaurantId: number): Promise<CreateConnectedAccountForRestaurantResult> {
    const restaurant = await this.restaurantsModel.getRestaurantEntityByID(restaurantId);
    if (!restaurant) {
      logger.error(`Restaurant not found for id: ${restaurantId}`);
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant not found for id: ${restaurantId}.`));
    }

    const existingConnectAccount = await this.stripeConnectAccountModel.findByRestaurantId(restaurantId);
    const existingStripeAccountId = existingConnectAccount?.stripe_account_id ?? restaurant.stripe_account_id ?? null;

    if (existingStripeAccountId) {
      try {
        const link = await this.stripeService.createConnectOnboardingLink(existingStripeAccountId);
        return { account_id: existingStripeAccountId, onboarding_url: link.url };
      } catch (err) {
        if (err instanceof HttpException) throw err;
        logger.error(`Failed to create Stripe Connect onboarding link for restaurant ${restaurantId}: ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.stripeException, 'Unable to create Stripe Connect onboarding link. Please try again later.'),
        );
      }
    }

    try {
      const account = await this.stripeService.createConnectAccount();
      const onboardingStatus = account.details_submitted ? 'completed' : 'pending';
      const capabilities =
        account.capabilities && typeof account.capabilities === 'object' ? (account.capabilities as Record<string, unknown>) : undefined;
      const rawAccount = account as unknown as Record<string, unknown>;

      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async (conn: EntityManager) => {
        await this.stripeConnectAccountModel.insertStripeConnectAccount(
          {
            restaurant_id: restaurantId,
            stripe_account_id: account.id,
            charges_enabled: account.charges_enabled ?? false,
            details_submitted: account.details_submitted ?? false,
            onboarding_status: onboardingStatus,
            capabilities,
            raw_account: rawAccount,
          },
          conn,
        );
        await this.restaurantsModel.updateRestaurantEntity({ stripe_account_id: account.id }, restaurantId, conn);
      });

      const link = await this.stripeService.createConnectOnboardingLink(account.id);
      return { account_id: account.id, onboarding_url: link.url };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      logger.error(`Failed to create Stripe Connect account for restaurant ${restaurantId}: ${err}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.stripeException, 'Unable to set up Stripe Connect. Please try again later.'));
    }
  }

  async linkExistingConnectAccount(restaurantId: number, stripeAccountId: string): Promise<void> {
    const restaurant = await this.restaurantsModel.getRestaurantEntityByID(restaurantId);
    if (!restaurant) {
      logger.error(`Restaurant not found for id: ${restaurantId}`);
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant not found for id: ${restaurantId}.`));
    }

    const existingConnectAccount = await this.stripeConnectAccountModel.findByRestaurantId(restaurantId);
    const existingStripeAccountId = existingConnectAccount?.stripe_account_id ?? restaurant.stripe_account_id ?? null;
    if (existingStripeAccountId) {
      logger.warn(`Restaurant ${restaurantId} already has a Stripe Connect account: ${existingStripeAccountId}`);
      throw new HttpException(
        409,
        getErrorPayload(
          InternalErrorCode.resourceConflict,
          'Restaurant already has a Stripe Connect account. Unlink it first if you need to replace it.',
        ),
      );
    }

    const alreadyLinked = await this.stripeConnectAccountModel.findByStripeAccountId(stripeAccountId);
    if (alreadyLinked && alreadyLinked.restaurant_id !== restaurantId) {
      logger.warn(`Stripe account ${stripeAccountId} is already linked to restaurant ${alreadyLinked.restaurant_id}`);
      throw new HttpException(
        409,
        getErrorPayload(InternalErrorCode.resourceConflict, 'This Stripe Connect account is already linked to another restaurant.'),
      );
    }

    let account: Awaited<ReturnType<StripeServiceInterface['retrieveConnectAccount']>>;
    try {
      account = await this.stripeService.retrieveConnectAccount(stripeAccountId);
    } catch (err) {
      logger.error(`Failed to retrieve Stripe Connect account ${stripeAccountId}: ${err}`);
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.inputValueNotInDB,
          'Stripe Connect account not found or not accessible. Check the account ID and try again.',
        ),
      );
    }

    const onboardingStatus = account.details_submitted ? 'completed' : 'pending';
    const capabilities =
      account.capabilities && typeof account.capabilities === 'object' ? (account.capabilities as Record<string, unknown>) : undefined;
    const rawAccount = account as unknown as Record<string, unknown>;

    const ormConn: EntityManager = await ormConnection();
    await ormConn.transaction(async (conn: EntityManager) => {
      await this.stripeConnectAccountModel.insertStripeConnectAccount(
        {
          restaurant_id: restaurantId,
          stripe_account_id: account.id,
          charges_enabled: account.charges_enabled ?? false,
          details_submitted: account.details_submitted ?? false,
          onboarding_status: onboardingStatus,
          capabilities,
          raw_account: rawAccount,
        },
        conn,
      );
      await this.restaurantsModel.updateRestaurantEntity({ stripe_account_id: account.id }, restaurantId, conn);
    });
  }
}
