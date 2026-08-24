import { HttpException } from '@exceptions/HttpException';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import MediaLibraryService from '@/services/mediaLibrary.service';
import { MediaEntity } from '@/entities/media.entity';
import { EntityManager } from 'typeorm';
import { createSignedURLUtility } from '@/utils/GCP_bucket';
import { generateVideoNameWithOnlyExtensionProvided } from '@/utils/imageUtils';
import { APP_CONFIG } from '@/configs/config';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/GCP_bucket', () => require('../../../../__mocks__/GCP_bucket'));

jest.mock('@/models/mediaLibrary.model', () => {
  const mockMediaLibraryModel = {
    getMediaByMediaID: jest.fn(),
    getMediaByRestaurantID: jest.fn(),
    insertMedia: jest.fn(),
    softDeleteMediaByMediaID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMediaLibraryModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

// create mock menus model object
const mockMediaLibraryModel = new MediaLibraryModel();
const mediaLibraryService = new MediaLibraryService(mockMediaLibraryModel);

describe('MediaLibraryService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('insertMedia', () => {
    // mock model response
    const MEDIA_ID = 1;
    const RESTAURANT_ID = 2;
    const MEDIA_TYPE_ID = 3;
    const FIRST_IMAGE_NAME = 'some_image';
    const mockModelResponse: MediaEntity[] = [
      new MediaEntity('test.jpeg', MEDIA_TYPE_ID, RESTAURANT_ID, FIRST_IMAGE_NAME, MEDIA_ID),
      new MediaEntity('test2.jpeg', MEDIA_TYPE_ID, RESTAURANT_ID, null, MEDIA_ID),
    ];
    it('should successfully insert media library entities', async () => {
      // set up mock model to return our mock response to service
      (mockMediaLibraryModel.insertMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await mediaLibraryService.insertMedia(mockModelResponse, {} as EntityManager);
      // enforce test expectations
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledWith(mockModelResponse, {} as EntityManager);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while inserting media library entities', async () => {
      (mockMediaLibraryModel.insertMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.insertMedia(mockModelResponse);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertImages', () => {
    // mock model response
    const IMAGES = [
      { media_url: 'test1.jpeg', name: 'blah1' },
      { media_url: 'test2.jpeg', name: 'blah2' },
    ];
    const RESTAURANT_ID = 2;
    const MEDIA_TYPE_ID = 1;
    const mediaEntities: MediaEntity[] = [
      new MediaEntity(IMAGES[0].media_url, MEDIA_TYPE_ID, RESTAURANT_ID, IMAGES[0].name),
      new MediaEntity(IMAGES[1].media_url, MEDIA_TYPE_ID, RESTAURANT_ID, IMAGES[1].name),
    ];
    const mockModelResponse: MediaEntity[] = [
      new MediaEntity(IMAGES[0].media_url, MEDIA_TYPE_ID, RESTAURANT_ID, IMAGES[0].name, 1),
      new MediaEntity(IMAGES[1].media_url, MEDIA_TYPE_ID, RESTAURANT_ID, IMAGES[1].name, 2),
    ];
    const imageResponse = [
      {
        mediaID: 1,
        mediaUrl: expect.any(String),
        type: 'image',
        name: 'blah1',
      },
      {
        mediaID: 2,
        mediaUrl: expect.any(String),
        type: 'image',
        name: 'blah2',
      },
    ];
    it('should successfully insert media library entities', async () => {
      // set up mock model to return our mock response to service
      (mockMediaLibraryModel.insertMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await mediaLibraryService.insertImages(IMAGES, RESTAURANT_ID, {} as EntityManager);
      // enforce test expectations
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledWith(mediaEntities);
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledTimes(1);
      expect(result).toEqual(imageResponse);
    });
    it('should throw a HttpException if any error occurs while inserting media library entities', async () => {
      (mockMediaLibraryModel.insertMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.insertImages(IMAGES, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledWith(mediaEntities);
    });
  });
  describe('getMediaByRestaurantID', () => {
    // mock model response
    const IMAGES = ['test1.jpeg', 'test2.jpeg'];
    const RESTAURANT_ID = 1;
    const MEDIA_TYPE_ID = 1;
    const mockModelResponse: MediaEntity[] = [
      new MediaEntity(IMAGES[0], MEDIA_TYPE_ID, RESTAURANT_ID, 'blah', 1),
      new MediaEntity(IMAGES[1], MEDIA_TYPE_ID, RESTAURANT_ID, null, 2),
    ];
    it('should successfully get media library entities', async () => {
      // set up mock model to return our mock response to service
      (mockMediaLibraryModel.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await mediaLibraryService.getMediaByRestaurantID(RESTAURANT_ID);
      // enforce test expectations
      expect(mockMediaLibraryModel.getMediaByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, 'created_at');
      expect(mockMediaLibraryModel.getMediaByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while getting media library entities', async () => {
      (mockMediaLibraryModel.getMediaByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.getMediaByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.getMediaByRestaurantID).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertVideos', () => {
    // mock model response
    const NAME = 'some_video';
    const VIDEOS = [{ media_url: 'test1.mp4', name: NAME }];
    const RESTAURANT_ID = 2;
    const MEDIA_TYPE_ID = 2;
    const mediaEntities: MediaEntity[] = [new MediaEntity(VIDEOS[0].media_url, MEDIA_TYPE_ID, RESTAURANT_ID, NAME)];
    const mockModelResponse: MediaEntity[] = [new MediaEntity(VIDEOS[0].media_url, MEDIA_TYPE_ID, RESTAURANT_ID, NAME, 1)];
    const videoResponse = [
      {
        mediaID: 1,
        mediaUrl: expect.any(String),
        type: 'video',
        name: NAME,
      },
    ];
    it('should successfully insert media library video entities', async () => {
      // set up mock model to return our mock response to service
      (mockMediaLibraryModel.insertMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await mediaLibraryService.insertVideos(VIDEOS, RESTAURANT_ID, {} as EntityManager);
      // enforce test expectations
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledWith(mediaEntities);
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledTimes(1);
      expect(result).toEqual(videoResponse);
    });
    it('should throw a HttpException if any error occurs while inserting media library video entities', async () => {
      (mockMediaLibraryModel.insertMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.insertVideos(VIDEOS, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.insertMedia).toHaveBeenCalledWith(mediaEntities);
    });
  });
  describe('softDeleteMediaByMediaID', () => {
    const MEDIA_ID = 1;
    const mockMediaEntity = {
      media_id: 1,
      menuItemVideoThumbnail: [],
      announcementsMedia: [],
    };
    const mockMediaEntityAsThumbnail = {
      media_id: 1,
      menuItemVideoThumbnail: [
        {
          mediaID: 1,
          menu_item_video_thumbnail_id: 1,
        },
      ],
      announcementsMedia: [],
    };
    const mockMediaEntityAsAnnouncementEmbed = {
      media_id: 1,
      menuItemVideoThumbnail: [],
      announcementsMedia: [
        {
          announcement_id: 1,
          mediaID: 1,
          announcement: {
            announcement_type_id: 2,
          },
        },
      ],
    };
    it('should successfully soft delete media library entity', async () => {
      (mockMediaLibraryModel.getMediaByMediaID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntity);

      await mediaLibraryService.softDeleteMediaByMediaID(MEDIA_ID, {} as EntityManager);
      // enforce test expectations
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
      expect(mockMediaLibraryModel.softDeleteMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID, {});
      expect(mockMediaLibraryModel.softDeleteMediaByMediaID).toHaveBeenCalledTimes(1);
    });
    it('should throw a 409 HttpException if media is of type menu item video thumbnail', async () => {
      (mockMediaLibraryModel.getMediaByMediaID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntityAsThumbnail);

      try {
        await mediaLibraryService.softDeleteMediaByMediaID(MEDIA_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
    });
    it('should throw a 409 HttpException if media is of type embed announcement', async () => {
      (mockMediaLibraryModel.getMediaByMediaID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntityAsAnnouncementEmbed);

      try {
        await mediaLibraryService.softDeleteMediaByMediaID(MEDIA_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
    });
    it('should throw a HttpException if any error occurs while soft deleting media entity from media library', async () => {
      (mockMediaLibraryModel.softDeleteMediaByMediaID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.softDeleteMediaByMediaID(MEDIA_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryModel.softDeleteMediaByMediaID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.softDeleteMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID, {});
    });
  });
  describe('getMediaByMediaID', () => {
    const MEDIA_ID = 1;
    it('should successfully get media by mediaID', async () => {
      await mediaLibraryService.getMediaByMediaID(MEDIA_ID);
      // enforce test expectations
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
    });
    it('should throw a HttpException if any error occurs while soft deleting media entity from media library', async () => {
      (mockMediaLibraryModel.getMediaByMediaID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.getMediaByMediaID(MEDIA_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryModel.getMediaByMediaID).toHaveBeenCalledWith(MEDIA_ID);
    });
  });
  describe('createSignedURL', () => {
    const EXT = 'mp4';
    const SIGNED_URL = 'https://dummy-signed-url.com';
    const FILE_NAME = 'some_uuid.mp4';
    it('should successfully generate signed url for long form video', async () => {
      (generateVideoNameWithOnlyExtensionProvided as jest.MockedFunction<any>).mockReturnValueOnce(FILE_NAME);
      (createSignedURLUtility as jest.MockedFunction<any>).mockResolvedValueOnce(SIGNED_URL);

      const result = await mediaLibraryService.createSignedURL(EXT);
      // enforce test expectations
      expect(generateVideoNameWithOnlyExtensionProvided).toHaveBeenCalledTimes(1);
      expect(createSignedURLUtility).toHaveBeenCalledTimes(1);

      expect(generateVideoNameWithOnlyExtensionProvided).toHaveBeenCalledWith(EXT);
      expect(createSignedURLUtility).toHaveBeenCalledWith(APP_CONFIG.IMAGE_BUCKET, FILE_NAME);

      expect(result).toEqual({
        signedURL: SIGNED_URL,
        fileName: FILE_NAME,
        videoUUID: FILE_NAME.split('.')[0],
      });
    });
    it('should throw a HttpException if any error occurs while generating signed url for long form video', async () => {
      (generateVideoNameWithOnlyExtensionProvided as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryService.createSignedURL(EXT);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(generateVideoNameWithOnlyExtensionProvided).toHaveBeenCalledTimes(1);
      expect(generateVideoNameWithOnlyExtensionProvided).toHaveBeenCalledWith(EXT);

      expect(createSignedURLUtility).not.toHaveBeenCalled();
    });
  });
});
