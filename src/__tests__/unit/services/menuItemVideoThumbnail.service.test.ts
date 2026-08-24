import { MenuItemVideoThumbnailEntity } from '@/entities/menuItemVideoThumbnails.entity';
import MenuItemVideoThumbnailsService from '@/services/menuItemVideoThumbnails.service';
import MenuItemVideoThumbnailsModel from '@/models/menuItemVideoThumbnails.model';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/models/menuItemVideoThumbnails.model', () => {
  const mockMenuItemVideoThumbnailsModel = {
    insertMenuItemVideoThumbnails: jest.fn(),
    softDeleteMenuItemVideoThumbnail: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemVideoThumbnailsModel) };
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

const mockMenuItemVideoThumbnailsModel = new MenuItemVideoThumbnailsModel();
const menuItemVideoThumbnailsService = new MenuItemVideoThumbnailsService(mockMenuItemVideoThumbnailsModel);

describe('MenuItemVideoThumbnailsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  const MENU_ITEM_VIDEO_THUMBNAIL_ID = 1;
  const MENU_ITEM_MEDIA_ID = 2;
  const THUMBNAIL_URL = 'test_image.jpeg';
  const mockModelResponse: MenuItemVideoThumbnailEntity = {
    created_at: '2022-02-02T02:44:11.950Z',
    updated_at: '2022-02-02T02:44:11.950Z',
    deleted_at: null,
    menu_item_video_thumbnail_id: MENU_ITEM_VIDEO_THUMBNAIL_ID,
    thumbnail_url: THUMBNAIL_URL,
    menu_item_media_id: MENU_ITEM_MEDIA_ID,
  };
  describe('insertMenuItemVideoThumbnails', () => {
    const insertedMenuItemVideoThumbnails: MenuItemVideoThumbnailEntity[] = [
      {
        menu_item_media_id: MENU_ITEM_MEDIA_ID,
        thumbnail_url: THUMBNAIL_URL,
      },
    ];
    it('should successfully insert menu item video thumbnail', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      (mockMenuItemVideoThumbnailsModel.insertMenuItemVideoThumbnails as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      await menuItemVideoThumbnailsService.insertMenuItemVideoThumbnails(insertedMenuItemVideoThumbnails);
      expect(mockMenuItemVideoThumbnailsModel.insertMenuItemVideoThumbnails).toHaveBeenCalledWith(insertedMenuItemVideoThumbnails, true);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemVideoThumbnailsService.insertMenuItemVideoThumbnails(insertedMenuItemVideoThumbnails);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemVideoThumbnailsModel.insertMenuItemVideoThumbnails).not.toHaveBeenCalled();
    });
  });
  describe('softDeleteMenuItemVideoThumbnail', () => {
    it('should soft delete  menu item video thumbnail (set deleted_at = timestamp)', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      (mockMenuItemVideoThumbnailsModel.softDeleteMenuItemVideoThumbnail as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      await menuItemVideoThumbnailsService.softDeleteMenuItemVideoThumbnail(MENU_ITEM_VIDEO_THUMBNAIL_ID);
      expect(mockMenuItemVideoThumbnailsModel.softDeleteMenuItemVideoThumbnail).toHaveBeenCalledWith(MENU_ITEM_VIDEO_THUMBNAIL_ID, true);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemVideoThumbnailsService.softDeleteMenuItemVideoThumbnail(MENU_ITEM_VIDEO_THUMBNAIL_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(mockMenuItemVideoThumbnailsModel.softDeleteMenuItemVideoThumbnail).not.toHaveBeenCalled();
    });
  });
});
