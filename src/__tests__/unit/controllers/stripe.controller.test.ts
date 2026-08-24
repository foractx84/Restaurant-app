import { Request, Response } from 'express-serve-static-core';
import StripeService from '@services/stripe.service';
import { ManagerPackageServiceInterface } from '@interfaces/managerPackage.interface';
import { ManagersServiceInterface } from '@interfaces/managers.interface';
import { StripeCustomerServiceInterface } from '@interfaces/stripeCustomer.interface';
import { StripeIdempotenceServiceInterface } from '@interfaces/stripeIdempotence.interface';
import { SubscriptionServiceInterface } from '@interfaces/subscription.interface';
import { StripeTaxServiceInterface } from '@/interfaces/stripeTax.interface';
import StripeController from '@controllers/stripe.controller';
import { NextFunction } from 'express';
import { SubscriptionItemServiceInterface } from '@/interfaces/subscriptionItem.interface';
import { RestaurantPackageServiceInterface } from '@/interfaces/restaurantPackage.interface';

jest.mock('@/services/stripe.service', () => {
  const mockStripeService = {
    createStripeCheckoutSession: jest.fn(),
    getStripeCheckoutSession: jest.fn(),
    getStripeCustomerPortal: jest.fn(),
    handleStripeEvent: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeService) };
});
jest.mock('stripe', () => {
  const stripeMock = {
    webhooks: {
      constructEvent: () => ({
        id: 'test_id',
        object: 'event',
      }),
    },
  };
  return { __esModule: true, default: jest.fn(() => stripeMock) };
});

const mockStripeService = new StripeService(
  {} as ManagerPackageServiceInterface,
  {} as ManagersServiceInterface,
  {} as StripeCustomerServiceInterface,
  {} as StripeIdempotenceServiceInterface,
  {} as SubscriptionServiceInterface,
  {} as StripeTaxServiceInterface,
  {} as SubscriptionItemServiceInterface,
  {} as RestaurantPackageServiceInterface,
);
const stripeController = new StripeController(mockStripeService);

describe('stripeController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createStripeCheckoutSession', () => {
    const mockServiceResponse = {
      sessionID: 'some_string',
    };
    const MANAGER_ID = 1;
    const STRIPE_CUSTOMER_ID = 'random_stripe_customer_id';
    it('should successfully create stripe checkout session and return session id string', async () => {
      // mock the required response for the test

      (mockStripeService.createStripeCheckoutSession as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      // mock a request needed by controller
      const mReq = {
        body: {
          packages: [
            {
              priceID: 'price_1LjpzlI6e6SkqLuRyoDkWtfc',
              quantity: 1,
            },
          ],
        },
      };
      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: MANAGER_ID, stripeCustomerID: STRIPE_CUSTOMER_ID },
      };

      // call on controller as the router would
      await stripeController.createStripeCheckoutSession(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockStripeService.createStripeCheckoutSession).toHaveBeenCalledWith(mReq.body, MANAGER_ID, STRIPE_CUSTOMER_ID);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create checkout session because of invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await stripeController.createStripeCheckoutSession(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockStripeService.createStripeCheckoutSession).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getStripeCheckoutSession', () => {
    const SESSION = 'some_session';
    const mockServiceResponse = {
      stripeCustomerID: 'some_customer_id',
      managerPackageIDs: [1, 2, 3],
      email: 'test@fake.com',
    };
    it('should successfully get stripe checkout session', async () => {
      // mock the required response for the test

      (mockStripeService.getStripeCheckoutSession as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      // mock a request needed by controller
      const mReq: Partial<Request> = {
        query: {
          session: SESSION,
        },
      };
      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      // call on controller as the router would
      await stripeController.getStripeCheckoutSession(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockStripeService.getStripeCheckoutSession).toHaveBeenCalledWith(mReq.query.session);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not get checkout session because of invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await stripeController.getStripeCheckoutSession(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockStripeService.getStripeCheckoutSession).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getStripeCustomerPortal', () => {
    const MANAGER_ID = 1;
    const STRIPE_CUSTOMER_ID = 'random_stripe_customer_id';
    it('should successfully fetch stripe customer portal and return url', async () => {
      const URL = 'test+stripe.com';
      (mockStripeService.getStripeCustomerPortal as jest.MockedFunction<any>).mockResolvedValueOnce(URL);

      const mReq = {};
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: MANAGER_ID, stripeCustomerID: STRIPE_CUSTOMER_ID },
      };

      await stripeController.getStripeCustomerPortal(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockStripeService.getStripeCustomerPortal).toHaveBeenCalledWith(MANAGER_ID, STRIPE_CUSTOMER_ID);
      expect(responseObject).toEqual(URL);
    });
    it('should not fetch stripe customer portal because of invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await stripeController.getStripeCustomerPortal(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockStripeService.getStripeCustomerPortal).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('initWebhook', () => {
    it('should successfully initiate webhook for stripe events and return 200 on success', async () => {
      const stripePayload = {
        id: 'test_id',
        object: 'event',
      };

      const payloadString = JSON.stringify(stripePayload, null, 2);
      const secret = 'whsec_test_secret';

      const mReq = {
        body: payloadString,
        headers: {
          'stripe-signature': secret,
        },
      } as unknown;

      const mRes: Partial<Response> = {
        json: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        status: jest.fn(code => {
          expect(code).toEqual(200);
          return {
            send: jest.fn(),
            end: jest.fn(),
          };
        }),
      };

      await stripeController.initWebhook(mReq as Request, mRes as Response);
      expect(mockStripeService.handleStripeEvent).toHaveBeenCalledTimes(1);
    });
    it('should return 400 if an error occurs while initiating webhook for stripe events', async () => {
      const mReq = {};
      const mRes: Partial<Response> = {
        json: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        status: jest.fn(code => {
          expect(code).toEqual(400);
          return {
            send: jest.fn(() => ({
              end: jest.fn(),
            })),
          };
        }),
      };

      await stripeController.initWebhook(mReq as Request, mRes as Response);
      expect(mockStripeService.handleStripeEvent).not.toHaveBeenCalled();
    });
  });
});
