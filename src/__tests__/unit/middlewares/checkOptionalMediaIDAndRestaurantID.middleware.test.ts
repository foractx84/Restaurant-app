import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import menuSectionLinkedToRestaurantMiddleware from '@/middlewares/checkMenuSectionIDAndRestaurantID.middleware';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import { checkOptionalMediaIDAndRestaurantIDMiddleware } from '@/middlewares/checkOptionalMediaIDAndRestaurantID.middleware';
import { MediaEntity } from '@/entities/media.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/mediaLibrary.model', () => {
  const mockMenuModel = {
    getMediaByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/exceptions/HttpException', () => {
  return { __esModule: true, getErrorPayload: jest.fn(), HttpException: Error, InternalErrorCode: jest.fn() };
});

const mediaModel = new MediaLibraryModel();

// unit testing
describe('checkOptionalMediaIDAndRestaurantIDMiddleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('optionalMediaIDLinkedToRestaurantIDMiddleware', () => {
    const MEDIA_ID = 10;
    const RESTAURANT_ID = 1;
    it('should successfully validate mediaID linked to restaurant if mediaID provided', async () => {
      // mock a request and response needed by controller
      const mReq: Partial<Request> = {
        params: {
          mediaID: `${MEDIA_ID}`,
        },
        headers: {
          authorization: 'token',
          restaurantID: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };

      const mockMediaEntity: MediaEntity[] = [
        new MediaEntity('test.jpeg', 1, RESTAURANT_ID, 'some_image', 9),
        new MediaEntity('test2.jpeg', 1, RESTAURANT_ID, null, MEDIA_ID),
      ];

      const mNext = jest.fn();

      (mediaModel.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntity);

      await checkOptionalMediaIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    });

    it('should not throw 400 HTTP exception if mediaID is not provided', async () => {
      // mock a request needed by controller
      const mReq: Partial<Request> = {
        params: {}, // No mediaID provided in the request
        headers: {
          authorization: 'token',
          restaurantID: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();

      try {
        await checkOptionalMediaIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
      } catch (err) {
        // If an exception is thrown, fail the test
        expect(true).toBe(false);
      }

      // If no exception is thrown, pass the test
      expect(mNext).toHaveBeenCalled();
    });
    it('should throw 401 HTTP exception if provided mediaID exist in the database ', async () => {
      // mock a request and response needed by controller
      const mReq: Partial<Request> = {
        params: {
          mediaID: `${MEDIA_ID}`,
        },
        headers: {
          authorization: 'token',
          restaurantID: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };

      const mockMediaEntity: MediaEntity[] = [
        new MediaEntity('test.jpeg', 1, RESTAURANT_ID, 'some_image', 9),
        new MediaEntity('test2.jpeg', 1, RESTAURANT_ID, null, 11),
      ];

      const mNext = jest.fn();

      (mediaModel.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntity);

      await checkOptionalMediaIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);

      try {
        await menuSectionLinkedToRestaurantMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mNext).toHaveBeenCalled();
    });
  });
});
