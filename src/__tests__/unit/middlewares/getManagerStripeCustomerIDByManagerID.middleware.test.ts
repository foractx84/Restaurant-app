import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { ManagerEntity } from '@/entities/manager.entity';
import ManagersModel from '@/models/managers.model';
import getManagerStripeCustomerIDByManagerID from '@/middlewares/getManagerStripeCustomerIDByManagerID.middleware';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/managers.model', () => {
  const mockManagerModel = {
    getManagerEntityByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerModel) };
});

const managerModel = new ManagersModel();

describe('getManagerStripeCustomerIDByManagerID', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  const STRIPE_CUSTOMER_ID = 'stripe_customer_id_string';
  const MANAGER_ID = 1;
  const RESTAURANT_ID = '1';
  it('should successfully get stripe customer id by managerID', async () => {
    const mReq: Partial<Request> = {
      body: {
        packages: [
          {
            priceID: 'price_1LjpzlI6e6SkqLuRyoDkWtfc',
            quantity: 1,
          },
        ],
      },
      headers: {
        authorization: 'token',
        restaurantID: RESTAURANT_ID,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { managerID: MANAGER_ID, stripeCustomerID: STRIPE_CUSTOMER_ID },
    };

    const mockManagerEntity = {
      id: 1,
      stripe_customer_id: STRIPE_CUSTOMER_ID,
    } as ManagerEntity;

    (managerModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerEntity);

    const mNext = jest.fn();

    await getManagerStripeCustomerIDByManagerID(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should not get stripe customer id since it does not exist for manager', async () => {
    const mReq: Partial<Request> = {
      body: {
        packages: [
          {
            priceID: 'price_1LjpzlI6e6SkqLuRyoDkWtfc',
            quantity: 1,
          },
        ],
      },
      headers: {
        authorization: 'token',
        restaurantID: RESTAURANT_ID,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { managerID: MANAGER_ID },
    };

    const mockManagerEntity = {
      id: 1,
    } as ManagerEntity;

    (managerModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerEntity);

    const mNext = jest.fn();

    await getManagerStripeCustomerIDByManagerID(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 400 Bad Request HTTP exception if managerID not provided in res.locals', async () => {
    const mReq: Partial<Request> = {
      body: {
        packages: [
          {
            priceID: 'price_1LjpzlI6e6SkqLuRyoDkWtfc',
            quantity: 1,
          },
        ],
      },
      headers: {
        authorization: 'token',
        restaurantID: RESTAURANT_ID,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    const mNext = jest.fn();

    try {
      await getManagerStripeCustomerIDByManagerID(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
