import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import DiscoveryContentModel from '@models/discoveryContent.model';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import { checkDiscoveryContentAndRestaurantIDMiddleware } from '@middlewares/checkDiscoveryContentAndRestaurantID.middleware';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContent.model', () => {
  const mockDiscoveryContentModel = {
    fetchDiscoveryContentByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentModel) };
});

const discoveryContentModel = new DiscoveryContentModel();

describe('checkDiscoveryContentAndRestaurantIDMiddleware', () => {
  const CONTENT_ID = 12;
  const RESTAURANT_ID = 1;
  const DISCOVERY_CONTENT: DiscoveryContentEntity = new DiscoveryContentEntity('Test', CONTENT_ID, 'This is a test', false, RESTAURANT_ID);

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find discovery content linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        discoveryContentID: CONTENT_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    (discoveryContentModel.fetchDiscoveryContentByID as jest.MockedFunction<any>).mockResolvedValueOnce(DISCOVERY_CONTENT);

    const mNext = jest.fn();

    await checkDiscoveryContentAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {
        discoveryContentID: CONTENT_ID,
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
      await checkDiscoveryContentAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if discovery content not linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        discoveryContentID: CONTENT_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '123',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (discoveryContentModel.fetchDiscoveryContentByID as jest.MockedFunction<any>).mockResolvedValueOnce(DISCOVERY_CONTENT);

    const mNext = jest.fn();

    try {
      await checkDiscoveryContentAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 Not found if discovery content does not exist', async () => {
    const mReq: Partial<Request> = {
      body: {
        discoveryContentID: CONTENT_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (discoveryContentModel.fetchDiscoveryContentByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    const mNext = jest.fn();

    try {
      await checkDiscoveryContentAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
