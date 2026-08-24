import { TapManagerError } from '@exceptions/HttpException';
import StripeCustomerModel from '@/models/stripeCustomer.model';

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

const stripeCustomerModel = new StripeCustomerModel();
describe('stripeCustomerModel', () => {
  describe('insertStripeCustomer', () => {
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    it('should insert manager packages successfully', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await stripeCustomerModel.insertStripeCustomer(STRIPE_CUSTOMER_ID, REPOSITORY);
      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while inserting stripe customer', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await stripeCustomerModel.insertStripeCustomer(STRIPE_CUSTOMER_ID, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
