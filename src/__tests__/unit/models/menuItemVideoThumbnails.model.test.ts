import { ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import MenuItemVideoThumbnailsModel from '@/models/menuItemVideoThumbnails.model';
import { MenuItemVideoThumbnailEntity } from '@/entities/menuItemVideoThumbnails.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
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

const menuItemVideoThumbnailsModel = new MenuItemVideoThumbnailsModel();
describe('MenuItemVideoThumbnailsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
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
    it('should insert menu item video thumbnail successfully', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: [mockModelResponse] });
      const REPOSITORY: any = {
        insert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await menuItemVideoThumbnailsModel.insertMenuItemVideoThumbnails(insertedMenuItemVideoThumbnails);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockModelResponse]);
    });
    it('should throw HttpException 500 if an error occurs while inserting menu item video thumbnail', async () => {
      const insert = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        insert,
      });

      try {
        await menuItemVideoThumbnailsModel.insertMenuItemVideoThumbnails(insertedMenuItemVideoThumbnails);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('softDeleteMenuItemVideoThumbnail', () => {
    it('should soft delete menu item video thumbnail successfully (update deleted_at to timestamp)', async () => {
      const execute = jest.fn();
      const returning = jest.fn(() => ({ execute }));
      const where = jest.fn(() => ({ returning }));
      const set = jest.fn(() => ({ where }));
      const update = jest.fn(() => ({ set }));

      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: () => REPOSITORY,
      });

      mockModelResponse.deleted_at = '2022-02-02T02:44:11.950Z';
      (execute as jest.MockedFunction<any>).mockResolvedValueOnce({ raw: [mockModelResponse] });

      const result = await menuItemVideoThumbnailsModel.softDeleteMenuItemVideoThumbnail(MENU_ITEM_VIDEO_THUMBNAIL_ID);

      expect(execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);

      mockModelResponse.deleted_at = null;
    });
    it('should throw HttpException 500 if an error occurs while soft deleting menu item video thumbnail', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      try {
        await menuItemVideoThumbnailsModel.softDeleteMenuItemVideoThumbnail(MENU_ITEM_VIDEO_THUMBNAIL_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
