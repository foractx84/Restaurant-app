import { TapManagerError } from '@exceptions/HttpException';
import SubscriptionModel from '@/models/subscription.model';
import SubscriptionService from '@services/subscription.service';
import SubscriptionItemService from '@services/subscriptionItem.service';
import { ProductPriceServiceInterface } from '@interfaces/productPrice.interface';
import { SubscriptionItemModelInterface } from '@interfaces/subscriptionItem.interface';
import Stripe from 'stripe';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/subscriptionItem.service', () => {
  const mockSubscriptionItemService = {
    createSubscriptionItems: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSubscriptionItemService) };
});
jest.mock('@/models/subscription.model', () => {
  const mockSubscriptionModel = {
    getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID: jest.fn(),
    insertSubscription: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSubscriptionModel) };
});

const mockSubscriptionItemService = new SubscriptionItemService({} as ProductPriceServiceInterface, {} as SubscriptionItemModelInterface);
const mockSubscriptionModel = new SubscriptionModel();
const subscriptionService = new SubscriptionService(mockSubscriptionItemService, mockSubscriptionModel);

describe('subscriptionService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createSubscription', () => {
    const SUBSCRIPTION_ID = 1;
    const STRIPE_SUBSCRIPTION_ID = 'stripe subscription id';
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe subscription item id';
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    const LINE_ITEMS: Stripe.LineItem[] = [
      {
        id: 'test_id',
        object: 'item',
        amount_discount: 0,
        amount_subtotal: 5700,
        amount_tax: 0,
        amount_total: 5700,
        currency: 'usd',
        description: '',
        price: null,
        quantity: 0,
      },
    ];
    const SUBSCRIPTION: SubscriptionEntity = {
      subscription_id: SUBSCRIPTION_ID,
      stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
      stripe_customer_id: STRIPE_CUSTOMER_ID,
      subscription_items: [],
    };
    const SUBSCRIPTION_ITEMS: SubscriptionItemEntity[] = [
      {
        amount: 5700,
        tax_amount: 0,
        status: 'paid',
        stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
      },
    ];
    const expectedResponse = {
      stripe_customer_id: STRIPE_CUSTOMER_ID,
      stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
      subscription_id: 1,
      subscription_items: [{ amount: 5700, status: 'paid', stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID, tax_amount: 0 }],
    };
    it('should successfully create a paid subscription', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      (mockSubscriptionModel.insertSubscription as jest.MockedFunction<any>).mockResolvedValueOnce(SUBSCRIPTION);
      (mockSubscriptionItemService.createSubscriptionItems as jest.MockedFunction<any>).mockResolvedValueOnce(SUBSCRIPTION_ITEMS);

      const result = await subscriptionService.createSubscription(STRIPE_SUBSCRIPTION_ID, LINE_ITEMS, STRIPE_CUSTOMER_ID, true);

      expect(mockSubscriptionModel.insertSubscription).toHaveBeenCalledWith(
        {
          stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
          stripe_customer_id: STRIPE_CUSTOMER_ID,
          started_at: expect.any(String),
        },
        {},
      );
      expect(mockSubscriptionItemService.createSubscriptionItems).toHaveBeenCalledWith(LINE_ITEMS, SUBSCRIPTION_ID, true, {});
      expect(result).toEqual(expectedResponse);
    });
    it('should successfully create an unpaid subscription', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      (mockSubscriptionModel.insertSubscription as jest.MockedFunction<any>).mockResolvedValueOnce(SUBSCRIPTION);
      (mockSubscriptionItemService.createSubscriptionItems as jest.MockedFunction<any>).mockResolvedValueOnce(SUBSCRIPTION_ITEMS);

      const result = await subscriptionService.createSubscription(STRIPE_SUBSCRIPTION_ID, LINE_ITEMS, STRIPE_CUSTOMER_ID, false);

      expect(mockSubscriptionModel.insertSubscription).toHaveBeenCalledWith(
        {
          stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
          stripe_customer_id: STRIPE_CUSTOMER_ID,
          started_at: null,
        },
        {},
      );
      expect(mockSubscriptionItemService.createSubscriptionItems).toHaveBeenCalledWith(LINE_ITEMS, SUBSCRIPTION_ID, false, {});
      expect(result).toEqual(expectedResponse);
    });
    it('should throw 500 HttpException if any error occurs while creating a subscription', async () => {
      (mockSubscriptionModel.insertSubscription as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionService.createSubscription(STRIPE_SUBSCRIPTION_ID, LINE_ITEMS, STRIPE_CUSTOMER_ID, true);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockSubscriptionModel.insertSubscription).toHaveBeenCalled();
      expect(mockSubscriptionItemService.createSubscriptionItems).not.toHaveBeenCalled();
    });
  });
  describe('getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID', () => {
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';
    const SUBSCRIPTION_ID = 1;
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe_subscription_item_id';
    const SUBSCRIPTION_ITEMS: SubscriptionItemEntity[] = [
      {
        amount: 5700,
        tax_amount: 0,
        status: 'paid',
        stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
      },
    ];
    const SUBSCRIPTION: SubscriptionEntity = {
      subscription_id: SUBSCRIPTION_ID,
      stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
      stripe_customer_id: STRIPE_CUSTOMER_ID,
      subscription_items: SUBSCRIPTION_ITEMS,
    };
    it('should successfully get a subscription and subscription items by stripe subscription id', async () => {
      (mockSubscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(
        SUBSCRIPTION,
      );

      const result = await subscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(
        STRIPE_SUBSCRIPTION_ID,
        {} as EntityManager,
      );

      expect(mockSubscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(
        STRIPE_SUBSCRIPTION_ID,
        {} as EntityManager,
      );
      expect(result).toEqual(SUBSCRIPTION);
    });
    it('should throw 404 HttpException if no subscription exists for stripeCustomerID', async () => {
      (mockSubscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await subscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(STRIPE_SUBSCRIPTION_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockSubscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(
        STRIPE_SUBSCRIPTION_ID,
        {} as EntityManager,
      );
    });
    it('should throw 500 HttpException if any error occurs while getting a subscription for stripeCustomerID', async () => {
      (mockSubscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(STRIPE_SUBSCRIPTION_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockSubscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(
        STRIPE_SUBSCRIPTION_ID,
        {} as EntityManager,
      );
    });
  });
});
