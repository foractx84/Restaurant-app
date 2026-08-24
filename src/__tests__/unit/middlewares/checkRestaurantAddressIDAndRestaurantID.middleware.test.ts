import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import checkRestaurantAddressIDAndRestaurantIDMiddleware from '@middlewares/checkRestaurantAddressIDAndRestaurantID.middleware';
import RestaurantAddressModel from '@/models/restaurantAddress.model';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/restaurantAddress.model', () => {
  const mockRestaurantAddressModel = {
    fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantAddressModel) };
});

const restaurantAddressModel = new RestaurantAddressModel();

describe('checkRestaurantAddressIDAndRestaurantIDMiddleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find restaurant address linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        address: {
          restaurantAddressID: 12,
        },
      },
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    const RESTAURANT_ADDRESS = {
      restaurant_id: 1,
      address1: 'Test 123 St',
    } as RestaurantAddressEntity;

    (restaurantAddressModel.fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
      RESTAURANT_ADDRESS,
    );

    const mNext = jest.fn();

    await checkRestaurantAddressIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('No exception thrown if address not included in body', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();
    await checkRestaurantAddressIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    const mNext = jest.fn();

    try {
      await checkRestaurantAddressIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if restaurant address not linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        address: {
          restaurantAddressID: 1,
        },
      },
      headers: {
        restaurantID: '1',
        authorization: 'token',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    const mNext = jest.fn();

    try {
      await checkRestaurantAddressIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
