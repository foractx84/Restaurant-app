import { NextFunction, Request, Response } from 'express-serve-static-core';
import { deleteMediaIfExists } from '@utils/imageUtils';
import { MediaLibraryModelInterface, MediaResponseInterface } from '@/interfaces/mediaLibrary.interface';
import MediaLibraryService from '@/services/mediaLibrary.service';
import MediaLibraryController from '@/controllers/media.controller';
import { MediaType } from '@/enums/mediaType';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/mediaLibrary.service', () => {
  const mockMediaervice = {
    createSignedURL: jest.fn(),
    getMediaByRestaurantID: jest.fn(),
    insertImages: jest.fn(),
    insertVideos: jest.fn(),
    softDeleteMediaByMediaID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMediaervice) };
});

// mock menus service object
const mockMediaService = new MediaLibraryService({} as MediaLibraryModelInterface);

// create test controller object
const mediaController = new MediaLibraryController(mockMediaService);

describe('mediaLibraryController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getMedia', () => {
    it('should successfully fetch all media for a restaurant', async () => {
      const mockMediaResults: MediaResponseInterface[] = [
        {
          mediaID: 1,
          mediaUrl: 'test.url',
          type: MediaType.IMAGE,
          createdAt: '2022-05-09T23:55:25.093Z',
        },
        {
          mediaID: 2,
          mediaUrl: 'test2.url',
          type: MediaType.IMAGE,
          createdAt: '2022-05-09T23:55:25.093Z',
        },
      ];

      (mockMediaService.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaResults);

      const mReq = {};

      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      await mediaController.getMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockMediaService.getMediaByRestaurantID);
    });
    it('should not retrieve media because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await mediaController.getMedia(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('uploadMediaImages', () => {
    const RESTAURANT_ID = 1;
    const IMAGES = [
      { media_url: 'df94-34ds-23f3-dfsr5.jpeg', name: 'some_image' },
      { media_url: 'df94-34ds-23f3-dfsr6.jpeg', name: null },
    ];
    it('should successfully upload media for restaurant media library', async () => {
      const mReq = {
        body: {},
        files: {
          images: [
            { filename: IMAGES[0].media_url, originalname: IMAGES[0].name },
            { filename: IMAGES[1].media_url, originalname: IMAGES[1].name },
          ],
        },
      } as unknown;
      const mockImageUploadResponse = [
        {
          mediaID: 1,
          mediaUrl: expect.any(String),
          type: MediaType.IMAGE,
        },
        {
          mediaID: 2,
          mediaUrl: expect.any(String),
          type: MediaType.IMAGE,
        },
      ] as MediaResponseInterface[];

      (mockMediaService.insertImages as jest.MockedFunction<any>).mockResolvedValueOnce(mockImageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await mediaController.uploadMediaImages(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMediaService.insertImages).toHaveBeenCalledWith(
        [{ ...IMAGES[0] }, { media_url: IMAGES[1].media_url, name: IMAGES[1].media_url }],
        RESTAURANT_ID,
      );
      expect(mockMediaService.insertImages).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockImageUploadResponse);
    });
    it('should delete images for restaurant if an exception occurs when any images', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {},
        files: {
          images: [
            { filename: IMAGES[0].media_url, originalname: IMAGES[0].name },
            { filename: IMAGES[1].media_url, originalname: IMAGES[1].name },
          ],
        },
      } as unknown;

      (mockMediaService.insertImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await mediaController.uploadMediaImages(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMediaService.insertImages).toHaveBeenCalledWith(
        [{ ...IMAGES[0] }, { media_url: IMAGES[1].media_url, name: IMAGES[1].media_url }],
        RESTAURANT_ID,
      );
      expect(mockMediaService.insertImages).toHaveBeenCalledTimes(1);
      expect(deleteMediaIfExists).toHaveBeenNthCalledWith(
        1,
        IMAGES.map(image => image.media_url),
      );

      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('uploadMediaVideos', () => {
    const RESTAURANT_ID = 1;
    const VIDEOS = [{ media_url: 'df94-34ds-23f3-dfsr5.mp4', name: 'some_video' }];
    it('should successfully upload media video for restaurant media library', async () => {
      const mReq = {
        body: {},
        files: {
          videos: [{ filename: VIDEOS[0].media_url, originalname: VIDEOS[0].name }],
        },
      } as unknown;
      const mockVideoUploadResponse = [
        {
          mediaID: 1,
          mediaUrl: expect.any(String),
          type: MediaType.VIDEO,
        },
      ] as MediaResponseInterface[];

      (mockMediaService.insertVideos as jest.MockedFunction<any>).mockResolvedValueOnce(mockVideoUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await mediaController.uploadMediaVideos(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMediaService.insertVideos).toHaveBeenCalledWith(VIDEOS, RESTAURANT_ID);
      expect(mockMediaService.insertVideos).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockVideoUploadResponse);
    });
    it('should delete videos for restaurant if an exception occurs with any images', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {},
        files: {
          videos: [{ filename: VIDEOS[0].media_url, originalname: VIDEOS[0].name }],
        },
      } as unknown;

      (mockMediaService.insertVideos as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await mediaController.uploadMediaVideos(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMediaService.insertVideos).toHaveBeenCalledWith(VIDEOS, RESTAURANT_ID);
      expect(mockMediaService.insertVideos).toHaveBeenCalledTimes(1);
      expect(deleteMediaIfExists).toHaveBeenNthCalledWith(
        1,
        VIDEOS.map(video => video.media_url),
      );

      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteMedia', () => {
    const MEDIA_ID = 10;
    const RESTAURANT_ID = 1;
    it('should successfully soft delete media for restaurant media library', async () => {
      const mReq = {
        params: {
          mediaID: MEDIA_ID,
        },
      } as unknown;

      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };

      await mediaController.deleteMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMediaService.softDeleteMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
      expect(mockMediaService.softDeleteMediaByMediaID).toHaveBeenCalledTimes(1);
    });
    it('should not delete media for restaurant media library if an exception occurs', async () => {
      const mReq = {
        params: {
          mediaID: MEDIA_ID,
        },
      } as unknown;

      const mNext = jest.fn();

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      (mockMediaService.softDeleteMediaByMediaID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await mediaController.deleteMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMediaService.softDeleteMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
      expect(mockMediaService.softDeleteMediaByMediaID).toHaveBeenCalledTimes(1);

      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('createSignedURL', () => {
    const EXT = 'mp4';
    it('should successfully create signed url of long form video', async () => {
      const mReq = {
        body: {
          extension: EXT,
        },
      } as unknown;

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: {},
      };

      const result = await mediaController.createSignedURL(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMediaService.createSignedURL).toHaveBeenCalledWith(EXT);
      expect(mockMediaService.createSignedURL).toHaveBeenCalledTimes(1);
      expect(result).toEqual(responseObject);
    });
    it('should not create signed url of long form video if an exception occurs', async () => {
      const mReq = {
        body: {
          extension: EXT,
        },
      } as unknown;

      const mNext = jest.fn();

      const mRes: Partial<Response> = {
        locals: {},
      };

      (mockMediaService.createSignedURL as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await mediaController.createSignedURL(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMediaService.createSignedURL).toHaveBeenCalledWith(EXT);
      expect(mockMediaService.createSignedURL).toHaveBeenCalledTimes(1);

      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkLongFormMediaToMediaLibrary', () => {
    const VIDEO_UUID = 'some_uuid';
    const ORIGINAL_FILENAME = 'test.mp4';
    it('should successfully link long form video media to media library', async () => {
      const mReq = {
        body: {
          videoUUID: VIDEO_UUID,
          originalFileName: ORIGINAL_FILENAME,
        },
      } as unknown;

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: {},
      };

      const result = await mediaController.linkLongFormMediaToMediaLibrary(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMediaService.insertVideos).toHaveBeenCalledTimes(1);
      expect(result).toEqual(responseObject[0]);
    });
    it('should not link long form video if an exception occurs', async () => {
      const mReq = {
        body: {
          videoUUID: VIDEO_UUID,
          originalFileName: ORIGINAL_FILENAME,
        },
      } as unknown;

      const mNext = jest.fn();

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: {},
      };

      (mockMediaService.insertVideos as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await mediaController.linkLongFormMediaToMediaLibrary(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMediaService.insertVideos).toHaveBeenCalledTimes(1);

      expect(mNext).toHaveBeenCalled();
    });
  });
});
