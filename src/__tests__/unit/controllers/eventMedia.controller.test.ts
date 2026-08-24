import { NextFunction, Request, Response } from 'express-serve-static-core';
import EventMediaController from '@controllers/eventMedia.controller';
import EventMediaService from '@services/eventMedia.service';
import { EventMediaModelInterface, EventMediaResponseInterface } from '@interfaces/eventMedia.interface';

const deleteMediaIfExistsMock = jest.fn();
jest.mock('@/utils/imageUtils', () => ({
  __esModule: true,
  ...require('../../../../__mocks__/imageUtils'),
  deleteMediaIfExists: (...args: any[]) => deleteMediaIfExistsMock(...args),
}));
jest.mock('@/services/eventMedia.service', () => {
  const mock = {
    listEventMedia: jest.fn(),
    insertEventMedia: jest.fn(),
    reorderEventMedia: jest.fn(),
    deleteEventMedia: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new EventMediaService({} as EventMediaModelInterface);
const controller = new EventMediaController(mockService);

const RESTAURANT_ID = 20;
const SAMPLE_MEDIA: EventMediaResponseInterface = {
  eventMediaID: 1,
  mediaUrl: 'https://cdn.example.com/abc.jpg',
  mediaType: 'image',
  listOrder: 0,
  altText: null,
};

describe('eventMediaController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listEventMedia', () => {
    it('should return the current media list', async () => {
      (mockService.listEventMedia as jest.MockedFunction<any>).mockResolvedValueOnce([SAMPLE_MEDIA]);
      let body: unknown;
      const mReq = {} as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.listEventMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.listEventMedia).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(body).toEqual([SAMPLE_MEDIA]);
    });
  });

  describe('uploadEventMedia', () => {
    it('should map files into insert items and pass to the service', async () => {
      (mockService.insertEventMedia as jest.MockedFunction<any>).mockResolvedValueOnce([SAMPLE_MEDIA]);
      let body: unknown;
      const mReq = {
        files: {
          images: [{ filename: 'a.jpg' }, { filename: 'b.jpg' }],
          video: [{ filename: 'c.mp4' }],
        },
      } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.uploadEventMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.insertEventMedia).toHaveBeenCalledWith(RESTAURANT_ID, [
        { mediaUrl: 'a.jpg', mediaType: 'image' },
        { mediaUrl: 'b.jpg', mediaType: 'image' },
        { mediaUrl: 'c.mp4', mediaType: 'video' },
      ]);
      expect(body).toEqual([SAMPLE_MEDIA]);
    });

    it('should roll back uploaded files via deleteMediaIfExists when the service throws', async () => {
      (mockService.insertEventMedia as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('cap exceeded'));
      const mNext = jest.fn();
      const mReq = {
        files: {
          images: [{ filename: 'a.jpg' }],
          video: [{ filename: 'c.mp4' }],
        },
      } as unknown as Request;
      const mRes: Partial<Response> = { locals: { restaurantID: RESTAURANT_ID } };

      await controller.uploadEventMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(deleteMediaIfExistsMock).toHaveBeenCalledWith(['a.jpg'], 'c.mp4');
      expect(mNext).toHaveBeenCalled();
    });

    it('should tolerate the missing files object on the request', async () => {
      (mockService.insertEventMedia as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      let body: unknown;
      const mReq = {} as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.uploadEventMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.insertEventMedia).toHaveBeenCalledWith(RESTAURANT_ID, []);
      expect(body).toEqual([]);
    });
  });

  describe('reorderEventMedia', () => {
    it('should respond 204 on success', async () => {
      (mockService.reorderEventMedia as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      let statusCode = 0;
      const end = jest.fn();
      const mReq = {
        body: { items: [{ eventMediaID: 1, listOrder: 0 }] },
      } as unknown as Request;
      const mRes: Partial<Response> = {
        status: jest.fn().mockImplementation((s: number) => {
          statusCode = s;
          return { end } as unknown as Response;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.reorderEventMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.reorderEventMedia).toHaveBeenCalledWith(RESTAURANT_ID, [{ eventMediaID: 1, listOrder: 0 }]);
      expect(statusCode).toEqual(204);
    });
  });

  describe('deleteEventMedia', () => {
    it('should respond 204 on success', async () => {
      (mockService.deleteEventMedia as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      let statusCode = 0;
      const end = jest.fn();
      const mReq = { params: { eventMediaID: '1' } } as unknown as Request;
      const mRes: Partial<Response> = {
        status: jest.fn().mockImplementation((s: number) => {
          statusCode = s;
          return { end } as unknown as Response;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.deleteEventMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.deleteEventMedia).toHaveBeenCalledWith(1, RESTAURANT_ID);
      expect(statusCode).toEqual(204);
    });
  });
});
