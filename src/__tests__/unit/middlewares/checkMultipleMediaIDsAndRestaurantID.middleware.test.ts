import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@exceptions/HttpException';
import MediaLibraryModel from '@models/mediaLibrary.model';
import { MediaEntity } from '@entities/media.entity';
import checkMultipleMediaIDLinkedToRestaurantIDMiddleware from '@middlewares/checkMultipleMediaIDsAndRestaurantID.middleware';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/mediaLibrary.model', () => {
  const mockMediaLibraryModel = {
    getMediaByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMediaLibraryModel) };
});

const mediaLibraryModel = new MediaLibraryModel();

describe('checkMultipleMediaIDsLinkedToRestaurantIDMiddleware', () => {
  const MEDIA_IDS = [1, 2];
  const RESTAURANT_ID = 1;
  const MEDIA: MediaEntity[] = [
    new MediaEntity('test_url1.jpg', 1, RESTAURANT_ID, 'some_image', MEDIA_IDS[0]),
    new MediaEntity('test_url2.jpg', 1, RESTAURANT_ID, null, MEDIA_IDS[1]),
  ];

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find media linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        mediaIDs: MEDIA_IDS,
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

    (mediaLibraryModel.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(MEDIA);

    const mNext = jest.fn();

    await checkMultipleMediaIDLinkedToRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {
        mediaIDs: MEDIA_IDS,
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
      await checkMultipleMediaIDLinkedToRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 401 Unauthorized if media id does not exist for restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        modifierID: [45],
      },
      headers: {
        authorization: 'token',
        restaurantID: '123',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    (mediaLibraryModel.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(MEDIA);

    const mNext = jest.fn();

    try {
      await checkMultipleMediaIDLinkedToRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(401);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
