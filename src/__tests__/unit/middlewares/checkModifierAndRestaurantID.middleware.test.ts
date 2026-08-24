import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import ModifierModel from '@/models/modifier.model';
import { checkModifierAndRestaurantIDMiddleware } from '@middlewares/checkModifierAndRestaurantID.middleware';
import { ModifierEntity } from '@/entities/modifier.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/modifier.model', () => {
  const mockModifierModel = {
    fetchModifierByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierModel) };
});

const modifierModel = new ModifierModel();

describe('checkModifierAndRestaurantIDMiddleware', () => {
  const MODIFIER_ID = 12;
  const RESTAURANT_ID = 1;
  const MODIFIER: ModifierEntity = new ModifierEntity('Test', MODIFIER_ID, 400, 'This is a test', false, RESTAURANT_ID);

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find modifier linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierID: MODIFIER_ID,
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

    (modifierModel.fetchModifierByID as jest.MockedFunction<any>).mockResolvedValueOnce(MODIFIER);

    const mNext = jest.fn();

    await checkModifierAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierID: MODIFIER_ID,
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
      await checkModifierAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if modifier not linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierID: MODIFIER_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '123',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (modifierModel.fetchModifierByID as jest.MockedFunction<any>).mockResolvedValueOnce(MODIFIER);

    const mNext = jest.fn();

    try {
      await checkModifierAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 Not found if modifier does not exist', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierID: MODIFIER_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (modifierModel.fetchModifierByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    const mNext = jest.fn();

    try {
      await checkModifierAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
