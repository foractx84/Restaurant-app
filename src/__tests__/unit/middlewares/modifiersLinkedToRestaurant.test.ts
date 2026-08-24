import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import ModifierModel from '@/models/modifier.model';
import { ModifierEntity } from '@/entities/modifier.entity';
import { modifiersLinkedToRestaurantMiddleware } from '@/middlewares/modifiersLinkedToRestaurant';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/modifier.model', () => {
  const mockModifierModel = {
    findModifiersByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierModel) };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    imageUpload: { fields: jest.fn() },
  };
});

const modifierModel = new ModifierModel();

describe('modifiersLinkedToRestaurantMiddleware', () => {
  const MODIFIER_ID = 10;
  const RESTAURANT_ID = 1;
  const MODIFIER: ModifierEntity = new ModifierEntity('Test', MODIFIER_ID, 400, 'This is a test', false, RESTAURANT_ID);

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully check modifier(s) in request are linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierIDs: [MODIFIER_ID],
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1, modifiersBeingLinked: [MODIFIER] },
    };

    (modifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([MODIFIER]);

    const mNext = jest.fn();

    await modifiersLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 401 if modifierID in request does not match any of the restaurant existing modifiers by modifierID ', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierIDs: [999],
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };

    (modifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([MODIFIER]);

    const mNext = jest.fn();

    try {
      await modifiersLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 if only some of the modifierIDs exist for the restaurant, while others do not', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierIDs: [MODIFIER_ID, 999],
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };

    (modifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([MODIFIER]);

    const mNext = jest.fn();

    try {
      await modifiersLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierIDs: [MODIFIER_ID],
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
      await modifiersLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if modifier not linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierIDs: MODIFIER_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '123',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (modifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([MODIFIER]);

    const mNext = jest.fn();

    try {
      await modifiersLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 Not found if modifier does not exist', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierIDs: [MODIFIER_ID],
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (modifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    const mNext = jest.fn();

    try {
      await modifiersLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
