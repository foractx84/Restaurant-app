import { ormConnection } from '@utils/dbUtils';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import MenuItemMediaModel from '@/models/menuItemMedia.model';

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

const menuItemMediaModel = new MenuItemMediaModel();
describe('MenuItemMediaModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('deleteMenuItemMedia', () => {
    it('should update (soft delete) menu item media image deleted_at', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await menuItemMediaModel.deleteMenuItemMedia([1]);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while getting soft deleting menu item media image', async () => {
      const update = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await menuItemMediaModel.deleteMenuItemMedia([1]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenuItemMediaByMenuItemID', () => {
    const MENU_ITEM_ID = 357;
    const MEDIA_URL_image = 'test_image.jpeg';
    const MENU_ITEM_MEDIA_IMAGE_ENTITY = {
      menu_item_media_id: 1,
      menu_item_id: MENU_ITEM_ID,
      media_url: MEDIA_URL_image,
      menu_item_media_type_id: 1,
    };
    const MENU_ITEM_MEDIA_IMAGE = [MENU_ITEM_MEDIA_IMAGE_ENTITY];
    it('should get just menu item media image successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const andWhere2 = jest.fn(() => ({ getMany }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ where }));
      const leftJoinAndSelect = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));

      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValue(MENU_ITEM_MEDIA_IMAGE);

      const result = await menuItemMediaModel.getMenuItemMediaByMenuItemID(MENU_ITEM_ID);
      expect(result).toEqual(MENU_ITEM_MEDIA_IMAGE);
    });
    it('should throw HttpException 500 if an error occurs while getting menu item images', async () => {
      const getRepository = jest.fn();
      const createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);

      try {
        await menuItemMediaModel.getMenuItemMediaByMenuItemID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('insertMenuItemMedia', () => {
    const MENU_ITEM_ID = 357;
    const IMAGE0 = 'test_image0.jpeg';
    const IMAGE1 = 'test_image1.jpeg';
    const MENU_ITEM_MEDIA_IMAGE0 = {
      menu_item_id: MENU_ITEM_ID,
      media_url: IMAGE0,
      menu_item_media_type_id: 1,
    };
    const MENU_ITEM_MEDIA_IMAGE1 = {
      menu_item_id: MENU_ITEM_ID,
      media_url: IMAGE1,
      menu_item_media_type_id: 1,
    };
    const MENU_ITEM_MEDIA_BOTH_IMAGES = [MENU_ITEM_MEDIA_IMAGE0, MENU_ITEM_MEDIA_IMAGE1];

    it('should insert all menu item images successfully', async () => {
      const mockedInsert = jest.fn().mockImplementation(() => {
        return {
          raw: [
            { ...MENU_ITEM_MEDIA_BOTH_IMAGES[0], menu_item_media_id: 1 },
            { ...MENU_ITEM_MEDIA_BOTH_IMAGES[1], menu_item_media_id: 2 },
          ],
        };
      });
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      const result = await menuItemMediaModel.insertMenuItemMedia(MENU_ITEM_MEDIA_BOTH_IMAGES);
      expect(mockedInsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { ...MENU_ITEM_MEDIA_BOTH_IMAGES[0], menu_item_media_id: 1 },
        { ...MENU_ITEM_MEDIA_BOTH_IMAGES[1], menu_item_media_id: 2 },
      ]);
    });
    it('should throw HttpException 500 if an error occurs while inserting menu item media images', async () => {
      const mockedInsert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      try {
        await menuItemMediaModel.insertMenuItemMedia(MENU_ITEM_MEDIA_BOTH_IMAGES);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('reorderMenuItemMediaImages', () => {
    const MENU_ITEM_ID = 357;
    const MENU_ITEM_MEDIA_ID = 1;
    const IMAGE0 = 'test_image0.jpeg';
    const IMAGE1 = 'test_image1.jpeg';
    const updatedListOrder = [
      {
        menu_item_id: MENU_ITEM_ID,
        menu_item_media_id: MENU_ITEM_MEDIA_ID,
        media_ur: IMAGE1,
        list_order: 1,
      },
      {
        menu_item_id: MENU_ITEM_ID,
        menu_item_media_id: MENU_ITEM_MEDIA_ID,
        media_ur: IMAGE0,
        list_order: 0,
      },
    ];
    it('should reorder all menu item images and write image_url to menu_items table successfully', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      await menuItemMediaModel.reorderMenuItemMediaImages(updatedListOrder);

      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while reordering menu item media images', async () => {
      const mockedSave = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await menuItemMediaModel.reorderMenuItemMediaImages(updatedListOrder);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
  });
  describe('softDeleteMenuItemMediaByIDs', () => {
    it('should update (soft delete) menu item media deleted_at', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await menuItemMediaModel.deleteMenuItemMedia([1]);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting menu item media image', async () => {
      const update = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await menuItemMediaModel.deleteMenuItemMedia([1]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
