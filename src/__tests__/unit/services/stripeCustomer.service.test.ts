import { TapManagerError } from '@exceptions/HttpException';
import StripeCustomerModel from '@/models/stripeCustomer.model';
import StripeCustomerService from '@services/stripeCustomer.service';
import { ormConnection } from '@utils/dbUtils';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/models/stripeCustomer.model', () => {
  const mockStripeCustomerModel = {
    insertStripeCustomer: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeCustomerModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockStripeCustomerModel = new StripeCustomerModel();
const stripeCustomerService = new StripeCustomerService(mockStripeCustomerModel);

describe('stripeCustomerService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createStripeCustomer', () => {
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    it('should successfully create a stripe customer', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      await stripeCustomerService.createStripeCustomer(STRIPE_CUSTOMER_ID);

      expect(mockStripeCustomerModel.insertStripeCustomer).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, {});
    });
    it('should throw 500 HttpException if any error occurs while creating stripe customer', async () => {
      (mockStripeCustomerModel.insertStripeCustomer as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeCustomerService.createStripeCustomer(STRIPE_CUSTOMER_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockStripeCustomerModel.insertStripeCustomer).toHaveBeenCalled();
    });
  });
});
