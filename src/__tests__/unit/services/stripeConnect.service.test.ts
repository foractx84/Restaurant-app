import { StripeConnectService } from '@/services/stripeConnect.service';
import { StripeServiceInterface } from '@/interfaces/stripe.interface';
import { RestaurantsModelInterface } from '@/interfaces/restaurants.interface';
import { StripeConnectAccountModelInterface } from '@/interfaces/stripeConnectAccount.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ormConnection } from '@utils/dbUtils';

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('@utils/dbUtils', () => ({
  __esModule: true,
  ormConnection: jest.fn(),
}));

const mockStripeService: StripeServiceInterface = {
  createStripeCheckoutSession: jest.fn(),
  getStripeCheckoutSession: jest.fn(),
  getStripeCustomerPortal: jest.fn(),
  createConnectAccount: jest.fn(),
  createConnectOnboardingLink: jest.fn(),
  retrieveConnectAccount: jest.fn(),
  handleStripeEvent: jest.fn(),
  handleStripeCheckoutCompletion: jest.fn(),
  handleStripeCustomerUpdate: jest.fn(),
};

const mockRestaurantsModel: RestaurantsModelInterface = {
  getRestaurantEntityByID: jest.fn(),
  updateRestaurantEntity: jest.fn(),
} as unknown as RestaurantsModelInterface;

const mockStripeConnectAccountModel: StripeConnectAccountModelInterface = {
  insertStripeConnectAccount: jest.fn(),
  findByRestaurantId: jest.fn(),
  findByStripeAccountId: jest.fn(),
};

const stripeConnectService = new StripeConnectService(mockStripeService, mockRestaurantsModel, mockStripeConnectAccountModel);

describe('StripeConnectService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createConnectedAccountForRestaurant', () => {
    const RESTAURANT_ID = 42;

    it('should throw 404 when restaurant is not found', async () => {
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(stripeConnectService.createConnectedAccountForRestaurant(RESTAURANT_ID)).rejects.toMatchObject({
        status: 404,
      });
      expect(mockStripeConnectAccountModel.findByRestaurantId).not.toHaveBeenCalled();
      expect(mockStripeService.createConnectAccount).not.toHaveBeenCalled();
    });

    it('should return new onboarding link when account already exists', async () => {
      const existingRestaurant = { restaurant_id: RESTAURANT_ID, stripe_account_id: 'acct_existing' } as RestaurantEntity;
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(existingRestaurant);
      (mockStripeConnectAccountModel.findByRestaurantId as jest.Mock).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        stripe_account_id: 'acct_existing',
      });
      (mockStripeService.createConnectOnboardingLink as jest.Mock).mockResolvedValueOnce({
        url: 'https://connect.stripe.com/setup/existing',
      });

      const result = await stripeConnectService.createConnectedAccountForRestaurant(RESTAURANT_ID);

      expect(result).toEqual({
        account_id: 'acct_existing',
        onboarding_url: 'https://connect.stripe.com/setup/existing',
      });
      expect(mockStripeService.createConnectAccount).not.toHaveBeenCalled();
      expect(mockStripeService.createConnectOnboardingLink).toHaveBeenCalledWith('acct_existing');
    });

    it('should create new Standard account, persist, and return onboarding link when no account exists', async () => {
      const transaction = jest.fn((cb: (conn: unknown) => Promise<void>) => cb({}));
      (ormConnection as jest.MockedFunction<typeof ormConnection>).mockResolvedValueOnce({ transaction } as any);
      const restaurant = { restaurant_id: RESTAURANT_ID } as RestaurantEntity;
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(restaurant);
      (mockStripeConnectAccountModel.findByRestaurantId as jest.Mock).mockResolvedValueOnce(null);
      (mockStripeService.createConnectAccount as jest.Mock).mockResolvedValueOnce({
        id: 'acct_new',
        charges_enabled: false,
        details_submitted: false,
        capabilities: { card_payments: { status: 'pending' }, transfers: { status: 'pending' } },
      });
      (mockStripeService.createConnectOnboardingLink as jest.Mock).mockResolvedValueOnce({
        url: 'https://connect.stripe.com/setup/new',
      });

      const result = await stripeConnectService.createConnectedAccountForRestaurant(RESTAURANT_ID);

      expect(result).toEqual({
        account_id: 'acct_new',
        onboarding_url: 'https://connect.stripe.com/setup/new',
      });
      expect(mockStripeService.createConnectAccount).toHaveBeenCalledTimes(1);
      expect(mockStripeConnectAccountModel.insertStripeConnectAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_id: RESTAURANT_ID,
          stripe_account_id: 'acct_new',
          charges_enabled: false,
          details_submitted: false,
          onboarding_status: 'pending',
        }),
        expect.anything(),
      );
      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith({ stripe_account_id: 'acct_new' }, RESTAURANT_ID, expect.anything());
      expect(mockStripeService.createConnectOnboardingLink).toHaveBeenCalledWith('acct_new');
    });
  });

  describe('linkExistingConnectAccount', () => {
    const RESTAURANT_ID = 42;
    const STRIPE_ACCOUNT_ID = 'acct_existing123';

    it('should throw 404 when restaurant is not found', async () => {
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(stripeConnectService.linkExistingConnectAccount(RESTAURANT_ID, STRIPE_ACCOUNT_ID)).rejects.toMatchObject({
        status: 404,
      });
      expect(mockStripeConnectAccountModel.findByRestaurantId).not.toHaveBeenCalled();
      expect(mockStripeConnectAccountModel.findByStripeAccountId).not.toHaveBeenCalled();
      expect(mockStripeService.retrieveConnectAccount).not.toHaveBeenCalled();
    });

    it('should throw 409 when restaurant already has a Stripe Connect account', async () => {
      const restaurant = { restaurant_id: RESTAURANT_ID } as RestaurantEntity;
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(restaurant);
      (mockStripeConnectAccountModel.findByRestaurantId as jest.Mock).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        stripe_account_id: 'acct_other',
      });

      await expect(stripeConnectService.linkExistingConnectAccount(RESTAURANT_ID, STRIPE_ACCOUNT_ID)).rejects.toMatchObject({
        status: 409,
      });
      expect(mockStripeConnectAccountModel.findByStripeAccountId).not.toHaveBeenCalled();
      expect(mockStripeService.retrieveConnectAccount).not.toHaveBeenCalled();
      expect(mockStripeConnectAccountModel.insertStripeConnectAccount).not.toHaveBeenCalled();
    });

    it('should throw 409 when Stripe account is already linked to another restaurant', async () => {
      const restaurant = { restaurant_id: RESTAURANT_ID } as RestaurantEntity;
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(restaurant);
      (mockStripeConnectAccountModel.findByRestaurantId as jest.Mock).mockResolvedValueOnce(null);
      (mockStripeConnectAccountModel.findByStripeAccountId as jest.Mock).mockResolvedValueOnce({
        restaurant_id: 999,
        stripe_account_id: STRIPE_ACCOUNT_ID,
      });

      await expect(stripeConnectService.linkExistingConnectAccount(RESTAURANT_ID, STRIPE_ACCOUNT_ID)).rejects.toMatchObject({
        status: 409,
      });
      expect(mockStripeService.retrieveConnectAccount).not.toHaveBeenCalled();
      expect(mockStripeConnectAccountModel.insertStripeConnectAccount).not.toHaveBeenCalled();
    });

    it('should throw 400 when Stripe retrieveConnectAccount fails', async () => {
      const restaurant = { restaurant_id: RESTAURANT_ID } as RestaurantEntity;
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(restaurant);
      (mockStripeConnectAccountModel.findByRestaurantId as jest.Mock).mockResolvedValueOnce(null);
      (mockStripeConnectAccountModel.findByStripeAccountId as jest.Mock).mockResolvedValueOnce(null);
      (mockStripeService.retrieveConnectAccount as jest.Mock).mockRejectedValueOnce(new Error('Stripe API error'));

      await expect(stripeConnectService.linkExistingConnectAccount(RESTAURANT_ID, STRIPE_ACCOUNT_ID)).rejects.toMatchObject({
        status: 400,
      });
      expect(mockStripeConnectAccountModel.insertStripeConnectAccount).not.toHaveBeenCalled();
      expect(mockRestaurantsModel.updateRestaurantEntity).not.toHaveBeenCalled();
    });

    it('should link account, persist and update restaurant when no existing link', async () => {
      const transaction = jest.fn((cb: (conn: unknown) => Promise<void>) => cb({}));
      (ormConnection as jest.MockedFunction<typeof ormConnection>).mockResolvedValueOnce({ transaction } as any);
      const restaurant = { restaurant_id: RESTAURANT_ID } as RestaurantEntity;
      (mockRestaurantsModel.getRestaurantEntityByID as jest.Mock).mockResolvedValueOnce(restaurant);
      (mockStripeConnectAccountModel.findByRestaurantId as jest.Mock).mockResolvedValueOnce(null);
      (mockStripeConnectAccountModel.findByStripeAccountId as jest.Mock).mockResolvedValueOnce(null);
      (mockStripeService.retrieveConnectAccount as jest.Mock).mockResolvedValueOnce({
        id: STRIPE_ACCOUNT_ID,
        charges_enabled: true,
        details_submitted: true,
        capabilities: { card_payments: { status: 'active' }, transfers: { status: 'active' } },
      });

      await stripeConnectService.linkExistingConnectAccount(RESTAURANT_ID, STRIPE_ACCOUNT_ID);

      expect(mockStripeService.retrieveConnectAccount).toHaveBeenCalledWith(STRIPE_ACCOUNT_ID);
      expect(mockStripeConnectAccountModel.insertStripeConnectAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_id: RESTAURANT_ID,
          stripe_account_id: STRIPE_ACCOUNT_ID,
          charges_enabled: true,
          details_submitted: true,
          onboarding_status: 'completed',
        }),
        expect.anything(),
      );
      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(
        { stripe_account_id: STRIPE_ACCOUNT_ID },
        RESTAURANT_ID,
        expect.anything(),
      );
    });
  });
});
