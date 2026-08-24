import { TapManagerError } from '@exceptions/HttpException';
import SubscriptionItemService from '@services/subscriptionItem.service';
import { ProductPriceModelInterface } from '@interfaces/productPrice.interface';
import Stripe from 'stripe';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import ProductPriceService from '@services/productPrice.service';
import SubscriptionItemModel from '@/models/subscriptionItem.model';
import { ProductPriceEntity } from '@/entities/productPrice.entity';
import { SubscriptionStatus } from '@/enums/subscriptionStatus';
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
jest.mock('@/services/productPrice.service', () => {
  const mockProductPriceService = {
    getProductPriceByStripePriceID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProductPriceService) };
});
jest.mock('@/models/subscriptionItem.model', () => {
  const mockSubscriptionItemModel = {
    getSubscriptionItemByStripeCustomerIDAndPackageID: jest.fn(),
    insertSubscriptionItems: jest.fn(),
    updateExpirationDateSubscriptionItems: jest.fn(),
    updateSubscriptionItem: jest.fn(),
    cancelSubscriptionItems: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSubscriptionItemModel) };
});

const mockProductPriceService = new ProductPriceService({} as ProductPriceModelInterface);
const mockSubscriptionItemModel = new SubscriptionItemModel();
const subscriptionItemService = new SubscriptionItemService(mockProductPriceService, mockSubscriptionItemModel);

describe('subscriptionItemService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createSubscriptionItems', () => {
    const SUBSCRIPTION_ID = 2;
    const PRODUCT_PRICE_ID = 1;
    const PACKAGE_ID = 6;
    const PRICE_ID = 1;
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe subscription item id';
    const PRICE = {
      id: 'price id',
    } as unknown;
    const LINE_ITEMS: Stripe.LineItem[] = [
      {
        id: STRIPE_SUBSCRIPTION_ITEM_ID,
        object: 'item',
        amount_discount: 0,
        amount_subtotal: 5700,
        amount_tax: 0,
        amount_total: 5700,
        currency: 'usd',
        description: '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        price: PRICE,
        quantity: 0,
      },
    ];
    const PRODUCT_PRICE = {
      product_price_id: PRODUCT_PRICE_ID,
      payment_plan_id: {
        name: 'monthly',
      },
      product_id: {
        package_id: PACKAGE_ID,
      },
    } as unknown;
    const AMOUNT = 5700;
    const PAID_SUBSCRIPTION_ITEMS: SubscriptionItemEntity[] = [
      {
        subscription_item_id: 1,
        subscription_id: SUBSCRIPTION_ID,
        package_id: PACKAGE_ID,
        amount: AMOUNT,
        expiration_date: expect.any(String),
        tax_amount: 0,
        status: SubscriptionStatus.ACTIVE,
        stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
        price_id: PRICE_ID,
      },
    ];
    const UNPAID_SUBSCRIPTION_ITEMS: SubscriptionItemEntity[] = [
      {
        subscription_item_id: 1,
        subscription_id: SUBSCRIPTION_ID,
        package_id: PACKAGE_ID,
        amount: AMOUNT,
        expiration_date: null,
        tax_amount: 0,
        status: SubscriptionStatus.PENDING,
        stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
        price_id: PRICE_ID,
      },
    ];
    it('should successfully create paid subscription items', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      (mockProductPriceService.getProductPriceByStripePriceID as jest.MockedFunction<any>).mockResolvedValueOnce(PRODUCT_PRICE as ProductPriceEntity);
      (mockSubscriptionItemModel.insertSubscriptionItems as jest.MockedFunction<any>).mockResolvedValueOnce(PAID_SUBSCRIPTION_ITEMS);

      const result = await subscriptionItemService.createSubscriptionItems(LINE_ITEMS, SUBSCRIPTION_ID, true);

      expect(mockProductPriceService.getProductPriceByStripePriceID).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionItemModel.insertSubscriptionItems).toHaveBeenCalledWith(
        [
          {
            subscription_id: SUBSCRIPTION_ID,
            package_id: PACKAGE_ID,
            amount: AMOUNT,
            expiration_date: expect.any(String),
            tax_amount: 0,
            status: SubscriptionStatus.ACTIVE,
            stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
            price_id: PRICE_ID,
          },
        ],
        {},
      );
      expect(result).toEqual(PAID_SUBSCRIPTION_ITEMS);
    });
    it('should successfully create unpaid subscription items', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      (mockProductPriceService.getProductPriceByStripePriceID as jest.MockedFunction<any>).mockResolvedValueOnce(PRODUCT_PRICE as ProductPriceEntity);
      (mockSubscriptionItemModel.insertSubscriptionItems as jest.MockedFunction<any>).mockResolvedValueOnce(UNPAID_SUBSCRIPTION_ITEMS);

      const result = await subscriptionItemService.createSubscriptionItems(LINE_ITEMS, SUBSCRIPTION_ID, false);

      expect(mockProductPriceService.getProductPriceByStripePriceID).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionItemModel.insertSubscriptionItems).toHaveBeenCalledWith(
        [
          {
            subscription_id: SUBSCRIPTION_ID,
            package_id: PACKAGE_ID,
            amount: AMOUNT,
            expiration_date: null,
            tax_amount: 0,
            status: SubscriptionStatus.PENDING,
            stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
            price_id: PRICE_ID,
          },
        ],
        {},
      );
      expect(result).toEqual(UNPAID_SUBSCRIPTION_ITEMS);
    });
    it('should throw 500 HttpException if any error occurs while creating subscription items', async () => {
      (mockProductPriceService.getProductPriceByStripePriceID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionItemService.createSubscriptionItems(LINE_ITEMS, SUBSCRIPTION_ID, true);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProductPriceService.getProductPriceByStripePriceID).toHaveBeenCalled();
      expect(mockSubscriptionItemModel.insertSubscriptionItems).not.toHaveBeenCalled();
    });
  });
  describe('getSubscriptionItemByStripeCustomerIDAndPackageID', () => {
    const PACKAGE_ID = 6;
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    const SUBSCRIPTION_ITEMS: SubscriptionItemEntity[] = [
      {
        subscription_item_id: 1,
        subscription_id: 2,
        package_id: PACKAGE_ID,
        amount: 5700,
        expiration_date: expect.any(String),
        tax_amount: 0,
        status: SubscriptionStatus.ACTIVE,
        stripe_subscription_item_id: 'stripe subscription item id',
        price_id: 1,
      },
    ];
    it('should successfully get subscription item by stripe customer id and package id', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      (mockSubscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID as jest.MockedFunction<any>).mockResolvedValueOnce(
        SUBSCRIPTION_ITEMS,
      );

      const result = await subscriptionItemService.getSubscriptionItemByStripeCustomerIDAndPackageID(STRIPE_CUSTOMER_ID, PACKAGE_ID);

      expect(mockSubscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(SUBSCRIPTION_ITEMS);
    });
    it('should throw 500 HttpException if any error occurs while getting subscription items by stripe customer id and package id', async () => {
      (mockSubscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionItemService.getSubscriptionItemByStripeCustomerIDAndPackageID(STRIPE_CUSTOMER_ID, PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockSubscriptionItemModel.getSubscriptionItemByStripeCustomerIDAndPackageID).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateSubscriptionItem', () => {
    const SUBSCRIPTION_ID = 2;
    const RESTAURANT_PACKAGE_ID = 6;
    const PRICE_ID = 1;
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe subscription item id';
    const AMOUNT = 5700;
    const SUBSCRIPTION_ITEM: SubscriptionItemEntity = {
      subscription_item_id: 1,
      subscription_id: SUBSCRIPTION_ID,
      package_id: 1,
      amount: AMOUNT,
      expiration_date: expect.any(String),
      tax_amount: 0,
      status: SubscriptionStatus.ACTIVE,
      stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
      price_id: PRICE_ID,
    };
    it('should successfully update subscription item', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await subscriptionItemService.updateSubscriptionItem(SUBSCRIPTION_ITEM, RESTAURANT_PACKAGE_ID);

      expect(mockSubscriptionItemModel.updateSubscriptionItem).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while updating subscription item', async () => {
      (mockSubscriptionItemModel.updateSubscriptionItem as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionItemService.updateSubscriptionItem(SUBSCRIPTION_ITEM, RESTAURANT_PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockSubscriptionItemModel.updateSubscriptionItem).toHaveBeenCalled();
    });
  });
  describe('cancelSubscriptionItems', () => {
    const SUBSCRIPTION_ID = 2;
    const PRICE_ID = 1;
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe subscription item id';
    const AMOUNT = 5700;
    const SUBSCRIPTION_ITEM: SubscriptionItemEntity[] = [
      {
        subscription_item_id: 1,
        subscription_id: SUBSCRIPTION_ID,
        package_id: 1,
        amount: AMOUNT,
        expiration_date: expect.any(String),
        tax_amount: 0,
        status: SubscriptionStatus.ACTIVE,
        stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
        price_id: PRICE_ID,
      },
    ];
    const PRICE = {
      id: 'price id',
    } as unknown;
    const LINE_ITEMS: Stripe.LineItem[] = [
      {
        id: STRIPE_SUBSCRIPTION_ITEM_ID,
        object: 'item',
        amount_discount: 0,
        amount_subtotal: 5700,
        amount_tax: 0,
        amount_total: 5700,
        currency: 'usd',
        description: '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        price: PRICE,
        quantity: 0,
      },
    ];
    it('should successfully set subscription items to cancelled', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      (mockSubscriptionItemModel.cancelSubscriptionItems as jest.MockedFunction<any>).mockResolvedValueOnce([SUBSCRIPTION_ITEM]);

      const result = await subscriptionItemService.cancelSubscriptionItems(
        SUBSCRIPTION_ITEM.map(item => item.stripe_subscription_item_id),
        {} as EntityManager,
      );

      expect(mockSubscriptionItemModel.cancelSubscriptionItems).toHaveBeenCalledWith([STRIPE_SUBSCRIPTION_ITEM_ID], {} as EntityManager);
      expect(result).toEqual([SUBSCRIPTION_ITEM]);
    });
    it('should throw 500 HttpException if any error occurs while setting subscription item to cancelled', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionItemService.cancelSubscriptionItems(LINE_ITEMS.map(item => item.id));
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('setExpirationDateSubscriptionItems', () => {
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const PRICE_ID = 'stripe_price_id';
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe subscription item id';
    const PAYMENT_PLAN = 'monthly';
    const PRICE = {
      id: PRICE_ID,
      recurring: {
        interval: 'month',
      },
    } as unknown;
    const INVOICE_LINE_ITEMS: Stripe.InvoiceLineItem[] = [
      {
        id: STRIPE_SUBSCRIPTION_ITEM_ID,
        object: 'line_item',
        currency: 'usd',
        description: '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        price: PRICE,
        quantity: 0,
        amount: 0,
        amount_excluding_tax: 0,
        discount_amounts: [],
        discountable: false,
        discounts: null,
        livemode: false,
        metadata: {},
        period: null,
        plan: null,
        proration: true,
        proration_details: null,
        subscription: STRIPE_SUBSCRIPTION_ID,
        subscription_item: STRIPE_SUBSCRIPTION_ITEM_ID,
        unit_amount_excluding_tax: null,
        type: null,
      },
    ];
    it('should successfully set expiration date for subscription items', async () => {
      (mockSubscriptionItemModel.updateExpirationDateSubscriptionItems as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await subscriptionItemService.setExpirationDateSubscriptionItems(INVOICE_LINE_ITEMS, {} as EntityManager);

      expect(mockSubscriptionItemModel.updateExpirationDateSubscriptionItems).toHaveBeenCalledWith(
        STRIPE_SUBSCRIPTION_ITEM_ID,
        PAYMENT_PLAN,
        {} as EntityManager,
      );
    });
    it('should throw 500 HttpException if any error occurs while setting expiration date for subscription item', async () => {
      (mockSubscriptionItemModel.updateExpirationDateSubscriptionItems as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await subscriptionItemService.setExpirationDateSubscriptionItems(INVOICE_LINE_ITEMS);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
