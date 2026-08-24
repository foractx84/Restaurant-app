import { MediaEntity } from '@/entities/media.entity';
import { MenuItemMediaEntity } from '@/entities/menuItemMedia.entity';
import { MenuItemVideoThumbnailsModelInterface } from '@/interfaces/menuItemVideoThumbnail.interface';
import MenuItemMediaModel from '@/models/menuItemMedia.model';
import MenuItemMediaService from '@/services/menuItemMedia.service';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import MenuItemVideoThumbnailsService from '@services/menuItemVideoThumbnails.service';
import { MenuItemVideoThumbnailEntity } from '@entities/menuItemVideoThumbnails.entity';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/models/menuItemMedia.model', () => {
  const mockMenuItemMediaModel = {
    getMenuItemMediaByMenuItemID: jest.fn(),
    insertMenuItemMedia: jest.fn(),
    softDeleteMenuItemMediaByIDs: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemMediaModel) };
});
jest.mock('@/services/menuItemVideoThumbnails.service', () => {
  const mockMenuItemVideoThumbnailsService = {
    insertMenuItemVideoThumbnails: jest.fn(),
    softDeleteMenuItemVideoThumbnail: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemVideoThumbnailsService) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'www.test.com/',
  };

  const MOCK_MENU_ITEM_IMAGES = {
    MAX_MENU_ITEM_IMAGES_VALUE: 3,
    MAX_MENU_ITEM_VIDEOS_VALUE: 1,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    MENU_ITEM_MEDIA: MOCK_MENU_ITEM_IMAGES,
    default: MOCKED_APP_CONFIG,
  };
});

const mockMenuItemMediaModel = new MenuItemMediaModel();
const mockMenuItemVideoThumbnailsService = new MenuItemVideoThumbnailsService({} as MenuItemVideoThumbnailsModelInterface);
const menuItemMediaService = new MenuItemMediaService(mockMenuItemMediaModel, mockMenuItemVideoThumbnailsService);

describe('MenuItemMediaService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getMenuItemMediaByMenuItemID', () => {
    const mockImage = {
      menu_item_media_id: 1,
      menu_item_id: 2,
      media_url: 'test_image.jpeg',
      created_at: '2022-02-02T02:44:11.950Z',
      updated_at: '2022-02-02T02:44:11.950Z',
      list_order: 0,
      menu_item_media_type_id: 1,
      menu_item_video_thumbnail: {},
    };
    const mockSecondImage = {
      menu_item_media_id: 2,
      menu_item_id: 2,
      media_url: 'test_image2.jpeg',
      created_at: '2022-02-02T02:44:11.950Z',
      updated_at: '2022-02-02T02:44:11.950Z',
      list_order: 1,
      menu_item_media_type_id: 1,
      menu_item_video_thumbnail: {},
    };
    const mockModelResponse: MenuItemMediaEntity[] = [mockImage, mockSecondImage];
    it('should successfully get all menu item media images', async () => {
      (mockMenuItemMediaModel.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      await menuItemMediaService.getMenuItemMediaByMenuItemID(1);
      expect(mockMenuItemMediaModel.getMenuItemMediaByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should successfully get image type for menu item media images', async () => {
      (mockMenuItemMediaModel.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce([mockSecondImage]);

      await menuItemMediaService.getMenuItemMediaByMenuItemID(1);
      expect(mockMenuItemMediaModel.getMenuItemMediaByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuItemMediaModel.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemMediaService.getMenuItemMediaByMenuItemID(1);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemMediaModel.getMenuItemMediaByMenuItemID).toHaveBeenCalledTimes(1);
    });
  });
  describe('uploadMenuItemMedia', () => {
    it('should upload multiple menu item images', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemMediaService.uploadMenuItemMedia([], [], 357, []);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemMediaService.uploadMenuItemMedia([], [], 357, []);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('validateIDsIncluded', () => {
    const idsToDelete = [4, 5, 3];
    const existingImageIDs = [4, 5, 6];
    it('should throw 404 if idsToDelete contains an id that doesnt exist in existingImagesIDs', async () => {
      try {
        await menuItemMediaService.validateIDsIncluded(existingImageIDs, idsToDelete);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertMenuItemMedia', () => {
    const MENU_ITEM_ID = 345;
    const mockMedia: MediaEntity[] = [new MediaEntity('test.jpeg', 1, 2, null, 3)];
    const mockMenuItemMediaEntity: MenuItemMediaEntity[] = [new MenuItemMediaEntity(MENU_ITEM_ID, 3, 'test.jpeg', 1)];

    it('should insert menu item media', async () => {
      (mockMenuItemMediaModel.insertMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuItemMediaEntity);

      const result = await menuItemMediaService.insertMenuItemMedia(MENU_ITEM_ID, mockMedia, {} as EntityManager);

      expect(mockMenuItemMediaModel.insertMenuItemMedia).toHaveBeenCalledTimes(1);
      expect(mockMenuItemMediaModel.insertMenuItemMedia).toHaveBeenCalledWith(mockMenuItemMediaEntity, {});
      expect(result).toEqual(mockMenuItemMediaEntity);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuItemMediaModel.insertMenuItemMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemMediaService.insertMenuItemMedia(MENU_ITEM_ID, mockMedia, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemMediaModel.insertMenuItemMedia).toHaveBeenCalledTimes(1);
      expect(mockMenuItemMediaModel.insertMenuItemMedia).toHaveBeenCalledWith(mockMenuItemMediaEntity, {});
    });
  });
  describe('linkThumbnailsToMenuItem', () => {
    const MENU_ITEM_ID = 345;
    const MEDIA_ID = 23;
    const THUMBNAIL_ENTITIES: MenuItemVideoThumbnailEntity[] = [new MenuItemVideoThumbnailEntity(1, 'test_url.jpg', MEDIA_ID)];
    it('should link thumbnails for menu item media', async () => {
      (mockMenuItemVideoThumbnailsService.insertMenuItemVideoThumbnails as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await menuItemMediaService.linkThumbnailsToMenuItem(THUMBNAIL_ENTITIES, MENU_ITEM_ID, {} as EntityManager);

      expect(mockMenuItemVideoThumbnailsService.insertMenuItemVideoThumbnails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemVideoThumbnailsService.insertMenuItemVideoThumbnails).toHaveBeenCalledWith(THUMBNAIL_ENTITIES, {});
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuItemVideoThumbnailsService.insertMenuItemVideoThumbnails as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemMediaService.linkThumbnailsToMenuItem(THUMBNAIL_ENTITIES, MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemVideoThumbnailsService.insertMenuItemVideoThumbnails).toHaveBeenCalledTimes(1);
    });
  });
  describe('softDeleteMenuItemMediaByIDs', () => {
    const MENU_ITEM_ID = 345;
    const mediaIDs: number[] = [1, 2, 3];
    it('should soft delete menu item media by ids', async () => {
      await menuItemMediaService.softDeleteMenuItemMediaByIDs(mediaIDs, MENU_ITEM_ID, {} as EntityManager);

      expect(mockMenuItemMediaModel.softDeleteMenuItemMediaByIDs).toHaveBeenCalledTimes(1);
      expect(mockMenuItemMediaModel.softDeleteMenuItemMediaByIDs).toHaveBeenCalledWith(mediaIDs, MENU_ITEM_ID, {});
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuItemMediaModel.softDeleteMenuItemMediaByIDs as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemMediaService.softDeleteMenuItemMediaByIDs(mediaIDs, MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemMediaModel.softDeleteMenuItemMediaByIDs).toHaveBeenCalledTimes(1);
      expect(mockMenuItemMediaModel.softDeleteMenuItemMediaByIDs).toHaveBeenCalledWith(mediaIDs, MENU_ITEM_ID, {});
    });
  });
  describe('softDeleteThumbnailsByIDs', () => {
    const mediaIDs: number[] = [1, 2, 3];
    it('should soft delete menu item thumbnail media by ids', async () => {
      await menuItemMediaService.softDeleteThumbnailsByIDs(mediaIDs, {} as EntityManager);

      expect(mockMenuItemVideoThumbnailsService.softDeleteMenuItemVideoThumbnail).toHaveBeenCalledTimes(3);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuItemVideoThumbnailsService.softDeleteMenuItemVideoThumbnail as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemMediaService.softDeleteThumbnailsByIDs(mediaIDs, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemVideoThumbnailsService.softDeleteMenuItemVideoThumbnail).toHaveBeenCalledTimes(1);
    });
  });
});
