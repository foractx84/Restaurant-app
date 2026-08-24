import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import ModifierGroupModel from '@/models/modifierGroup.model';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { checkModifierGroupAndRestaurantIDMiddleware } from '@middlewares/checkModifierGroupAndRestaurantID.middleware';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/modifierGroup.model', () => {
  const mockModifierGroupModel = {
    fetchModifierGroupByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierGroupModel) };
});

const modifierGroupModel = new ModifierGroupModel();

describe('checkModifierGroupAndRestaurantIDMiddleware', () => {
  const MODIFIER_GROUP_ID = 12;
  const RESTAURANT_ID = 1;
  const MODIFIER_GROUP: ModifierGroupEntity = new ModifierGroupEntity('Test', 'Name', false, RESTAURANT_ID, MODIFIER_GROUP_ID);

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find modifier group linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierGroupID: MODIFIER_GROUP_ID,
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

    (modifierGroupModel.fetchModifierGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce(MODIFIER_GROUP);

    const mNext = jest.fn();

    await checkModifierGroupAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierGroupID: MODIFIER_GROUP_ID,
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
      await checkModifierGroupAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if modifier group not linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierGroupID: MODIFIER_GROUP_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '123',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (modifierGroupModel.fetchModifierGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce(MODIFIER_GROUP);

    const mNext = jest.fn();

    try {
      await checkModifierGroupAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 Not found if modifier group does not exist', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierGroupID: MODIFIER_GROUP_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (modifierGroupModel.fetchModifierGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    const mNext = jest.fn();

    try {
      await checkModifierGroupAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
