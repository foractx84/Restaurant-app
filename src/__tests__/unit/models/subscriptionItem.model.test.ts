import { rawQuery, ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import SubscriptionItemModel from '@/models/subscriptionItem.model';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import { SubscriptionStatus } from '@/enums/subscriptionStatus';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { PaymentPlan } from '@/enums/paymentPlan';

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
    rawQuery: jest.fn(),
    ormConnection: jest.fn(),
  };
});

const subscriptionItemModel = new SubscriptionItemModel();
describe('subscriptionItemModel', () => {
  const MOCK_SUBSCRIPTION_ITEMS = [
    {
      subscription_id: 1,
      amount: 5700,
      tax_amount: 0,
      status: SubscriptionStatus.ACTIVE,
      stripe_subscription_item_id: 'stripe subscription item id',
    },
  ];
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
    (rawQuery as jest.MockedFunction<any>).mockReset();
  });

  describe('getSubscriptionItemByStripeCustomerIDAndPackageID', () => {
    it('should get subscription items by stripe customer id and package id successfully', async () => {
      const MOCK_SUBSCRIPTION: SubscriptionEntity = {
        subscription_id: 1,
        subscription_items: MOCK_SUBSCRIPTION_ITEMS,
      };
      const expectedResponse: SubscriptionItemEntity[] = MOCK_SUBSCRIPTION_ITEMS;
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

      const result = await subscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID('stripe customer id', 1);

      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while getting subscription items by stripe customer id and package id', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      try {
        await subscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID('stripe customer id', 1);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertSubscriptionItems', () => {
    it('should insert subscription items successfully', async () => {
      const expectedResponse: SubscriptionItemEntity[] = MOCK_SUBSCRIPTION_ITEMS;

      const insert = jest.fn().mockResolvedValue({ raw: expectedResponse });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await subscriptionItemModel.insertSubscriptionItems(MOCK_SUBSCRIPTION_ITEMS as SubscriptionItemEntity[]);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting subscription items', async () => {
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
        await subscriptionItemModel.insertSubscriptionItems(MOCK_SUBSCRIPTION_ITEMS as SubscriptionItemEntity[]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateSubscriptionItem', () => {
    it('should update subscription item successfully', async () => {
      const update = jest.fn();
      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);

      await subscriptionItemModel.updateSubscriptionItem(MOCK_SUBSCRIPTION_ITEMS[0] as SubscriptionItemEntity);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating subscription item', async () => {
      const update = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);

      try {
        await subscriptionItemModel.updateSubscriptionItem(MOCK_SUBSCRIPTION_ITEMS[0] as SubscriptionItemEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(update).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateExpirationDateSubscriptionItems', () => {
    const PAYMENT_PLAN = PaymentPlan.MONTHLY;
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    it('should update subscription item expiration date successfully', async () => {
      const execute = jest.fn();
      const where = jest.fn(() => ({ execute }));
      const set = jest.fn(() => ({ where }));
      const update = jest.fn(() => ({ set }));

      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: () => REPOSITORY,
      });

      await subscriptionItemModel.updateExpirationDateSubscriptionItems(STRIPE_SUBSCRIPTION_ID, PAYMENT_PLAN);

      expect(execute).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating subscription item expiration date', async () => {
      const execute = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        execute,
      });

      try {
        await subscriptionItemModel.updateExpirationDateSubscriptionItems(STRIPE_SUBSCRIPTION_ID, PAYMENT_PLAN);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('cancelSubscriptionItems', () => {
    const STRIPE_SUBSCRIPTION_ITEM_ID = ['stripe_subscription_item_id_0', 'stripe_subscription_item_id_1'];
    const SUSCRIPTION_ITEMS_RESULT = [
      [
        {
          subscription_item_id: 19,
          subscription_id: 19,
          restaurant_package_id: 12,
          package_id: 1,
          created_at: '2022-10-17T16:29:03.036Z',
          updated_at: '2022-10-17T16:42:22.891Z',
          deleted_at: null,
          assigned_at: null,
          amount: 5900,
          expiration_date: '2022-11-17T18:29:03.360Z',
          tax_amount: 0,
          status: 'cancelled',
          stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID[0],
          price_id: 1,
        },
        {
          subscription_item_id: 20,
          subscription_id: 20,
          restaurant_package_id: null,
          package_id: 1,
          created_at: '2022-10-17T16:29:03.036Z',
          updated_at: '2022-10-17T16:42:22.891Z',
          deleted_at: null,
          assigned_at: null,
          amount: 5900,
          expiration_date: '2022-11-17T18:29:03.360Z',
          tax_amount: 0,
          status: 'cancelled',
          stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID[1],
          price_id: 1,
        },
      ],
      2,
    ];
    it('should update subscription item to be cancelled successfully', async () => {
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(SUSCRIPTION_ITEMS_RESULT);

      const result = await subscriptionItemModel.cancelSubscriptionItems(STRIPE_SUBSCRIPTION_ITEM_ID);

      expect(rawQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(SUSCRIPTION_ITEMS_RESULT[0]);
    });
    it('should throw a HttpException if any error occurs while updating subscription item to be cancelled', async () => {
      const rawQuery = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        rawQuery,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);

      try {
        await subscriptionItemModel.cancelSubscriptionItems(STRIPE_SUBSCRIPTION_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
