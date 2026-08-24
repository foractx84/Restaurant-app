import { ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import SubscriptionModel from '@/models/subscription.model';
import { SubscriptionEntity } from '@/entities/subscription.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const subscriptionModel = new SubscriptionModel();
describe('subscriptionModel', () => {
  const MOCK_SUBSCRIPTION = {
    stripe_subscription_id: 'stripe subscription id',
    stripe_customer_id: 'stripe customer id',
  };
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertSubscription', () => {
    it('should insert subscription successfully', async () => {
      const expectedResponse: SubscriptionEntity = {
        ...MOCK_SUBSCRIPTION,
      };

      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await subscriptionModel.insertSubscription(MOCK_SUBSCRIPTION as SubscriptionEntity);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting subscription', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await subscriptionModel.insertSubscription(MOCK_SUBSCRIPTION as SubscriptionEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID', () => {
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const MOCK_SUBSCRIPTION_ITEMS = [
      {
        subscription_id: 1,
        amount: 5900,
        tax_amount: 0,
        status: 'active',
        stripe_subscription_item_id: 'stripe_subscription_item_id',
        package_id: 1,
        expiration_date: '2022-11-04T11:45:52.698Z',
        price_id: 3,
        restaurant_package_id: null,
        subscription_item_id: 5,
      },
    ];
    const MOCK_SUBSCRIPTION: SubscriptionEntity = {
      subscription_id: 1,
      stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
      stripe_customer_id: 'stripe_customer_id',
      subscription_items: MOCK_SUBSCRIPTION_ITEMS,
    };
    const expectedResponse: SubscriptionEntity[] = [
      {
        subscription_id: 1,
        stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
        stripe_customer_id: 'stripe_customer_id',
        subscription_items: [
          {
            subscription_item_id: 5,
            subscription_id: 1,
            restaurant_package_id: null,
            package_id: 1,
            amount: 5900,
            expiration_date: '2022-11-04T11:45:52.698Z',
            tax_amount: 0,
            status: 'active',
            stripe_subscription_item_id: 'stripe_subscription_item_id',
            price_id: 3,
          },
        ],
      },
    ];
    it('should get subscription and subscription items successfully', async () => {
      const getMany = jest.fn();
      const andWhere = jest.fn(() => ({ getMany }));
      const where = jest.fn(() => ({ andWhere }));
      const leftJoinAndSelect = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));
      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce([MOCK_SUBSCRIPTION]);

      const result = await subscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(STRIPE_SUBSCRIPTION_ID);

      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while getting a subscription and subscription items', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      try {
        await subscriptionModel.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(STRIPE_SUBSCRIPTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
