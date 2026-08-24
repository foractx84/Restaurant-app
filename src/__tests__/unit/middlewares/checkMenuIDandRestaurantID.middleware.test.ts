import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import menuLinkedToRestaurantMiddleware from '@/middlewares/checkMenuIDAndRestaurantID.middeware';
import { ormConnection } from '@/utils/dbUtils';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
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
jest.mock('@/exceptions/HttpException', () => {
  return { __esModule: true, getErrorPayload: jest.fn(), HttpException: Error, InternalErrorCode: jest.fn() };
});

// unit testing
describe('checkMenuIDandRestaurantIDMiddleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find menu linked to restaurant ', async () => {
    // mock a request and response needed by controller
    const mReq: Partial<Request> = {
      body: {
        menuID: 275,
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

    const mockMenuNotEmpty = {
      restaurantID: 1,
      menuID: 275,
    };

    const findOne = jest.fn().mockResolvedValue(mockMenuNotEmpty);
    const REPOSITORY: any = {
      findOne,
    };

    (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
      getCustomRepository: () => REPOSITORY,
    });
    const mNext = jest.fn();

    expect(async () => {
      await menuLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    }).not.toThrow(HttpException);
  });
  it('should throw HTTP exception if restaurantID not provided in body request', async () => {
    // mock a request needed by controller
    const mReq: Partial<Request> = {
      body: {
        menuID: 275,
      },
      headers: {
        authorization: 'token',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    const mNext = jest.fn();

    try {
      await menuLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw HTTP exception if menuID not provided in body request', async () => {
    // mock a request needed by controller
    const mReq: Partial<Request> = {
      body: {},
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
      await menuLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }
    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if menu not linked to restaurant', async () => {
    // mock a request needed by controller
    const mReq: Partial<Request> = {
      body: {
        menuID: 286,
      },
      headers: {
        restaurantID: '1',
        authorization: 'token',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };

    const mockMenuEmpty = {};
    const findOne = jest.fn().mockResolvedValue(mockMenuEmpty);
    const REPOSITORY: any = {
      findOne,
    };

    (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
      getCustomRepository: () => REPOSITORY,
    });
    const mNext = jest.fn();

    try {
      await menuLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
