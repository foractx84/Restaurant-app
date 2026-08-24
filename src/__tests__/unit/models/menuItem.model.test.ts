import MenuItemModel from '@/models/menuItem.model';
import { ormConnection, rawQuery } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { MenuItemDBInterface } from '@interfaces/menuItem.interface';

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
    rawQuery: jest.fn(),
  };
});

const menuItemModel = new MenuItemModel();
describe('menuItemModel', () => {
  const MENU_ITEM_ID = 123;
  const MOCK_MENU_ITEM = {
    name: 'Test Item',
    description: 'Test description',
    category: 'food',
    menu_section_id: 1,
    base_item_size_id: 50,
    calories: 100,
  };
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('deleteMenuItemByID', () => {
    it('should successfully delete menu item by id', async () => {
      const deleteSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      await menuItemModel.deleteMenuItemByID(MENU_ITEM_ID);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while deleting menu item by id', async () => {
      const deleteSpy = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      try {
        await menuItemModel.deleteMenuItemByID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMenuItemEntityByID', () => {
    const MENU_ITEM_ID = 1;
    it('should successfully get menu item entity menu item id', async () => {
      const findOne = jest.fn();

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await menuItemModel.getMenuItemEntityByID(MENU_ITEM_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while getting menu item entity by id', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await menuItemModel.getMenuItemEntityByID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMenuItemEntityWithMediaByID', () => {
    const MENU_ITEM_ID = 1;
    it('should successfully get menu item entity menu item id', async () => {
      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere3 = jest.fn(() => ({ getOne }));
      const andWhere2 = jest.fn(() => ({ andWhere: andWhere3 }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect4 = jest.fn(() => ({ where }));
      const leftJoinAndSelect3 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect4 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect1 }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      getRepository.mockImplementation(() => createQueryBuilder);

      await menuItemModel.getMenuItemEntityWithMediaByID(MENU_ITEM_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while getting menu item entity by id', async () => {
      const getOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getOne,
      });

      try {
        await menuItemModel.getMenuItemEntityWithMediaByID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertMenuItem', () => {
    it('should insert menu item successfully', async () => {
      const expectedResponse: MenuItemDBInterface = {
        menu_item_id: MENU_ITEM_ID,
        menu_item_url_id: 'fgfd-453-fgdf',
        name: 'Test Item',
        description: 'Test description',
        image_url: null,
        category: 'food',
        menu_section_id: 1,
        list_order: 0,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        deleted: false,
        base_item_size_id: 50,
        is_hidden: false,
        is_featured: false,
        calories: 100,
      };

      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await menuItemModel.insertMenuItem(MOCK_MENU_ITEM as MenuItemEntity);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting menu item', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await menuItemModel.insertMenuItem(MOCK_MENU_ITEM as MenuItemEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateMenuItem', () => {
    it('should successfully update menu item entity with no repository provided', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      await menuItemModel.updateMenuItem({} as MenuItemEntity);

      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should successfully update menu item entity with repository provided', async () => {
      const save = jest.fn();
      const REPOSITORY: any = {
        save,
      };

      await menuItemModel.updateMenuItem({} as MenuItemEntity, REPOSITORY);

      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while updating menu item entity with no repository provided', async () => {
      const save = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      try {
        await menuItemModel.updateMenuItem({} as MenuItemEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while updating menu item entity with repository provided', async () => {
      const save = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        save,
      };

      try {
        await menuItemModel.updateMenuItem({} as MenuItemEntity, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(save).toHaveBeenCalledTimes(1);
    });
  });
  describe('findMenuItemByIDAndRestaurantID', () => {
    it('should find menu item linked with restaurant id successfully', async () => {
      const MENU_ITEM_ID = 6;
      const RESTAURANT_ID = 1;
      const MENU_ITEM = {
        menu_item_id: MENU_ITEM_ID,
        menu_item_url_id: 'fgfd-453-fgdf',
        name: 'Test Item',
        description: 'Test description',
        image_url: null,
        category: 'food',
        menu_section_id: 1,
        list_order: 0,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        deleted: false,
        base_item_size_id: 50,
      };

      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere2 = jest.fn(() => ({ getOne }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ where: where1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEM);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await menuItemModel.findMenuItemByIDAndRestaurantID(MENU_ITEM_ID, RESTAURANT_ID);
      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MENU_ITEM);
    });
  });
  describe('softDeleteMenuItemByID', () => {
    it('should successfully update deleted column for menu item by id', async () => {
      const updateSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: updateSpy,
      });

      await menuItemModel.softDeleteMenuItemByID(MENU_ITEM_ID);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting menu item by id', async () => {
      const updateSpy = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: updateSpy,
      });

      try {
        await menuItemModel.softDeleteMenuItemByID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMenuItemsByMenuSection', () => {
    const MENU_SECTION = 5;
    it('should successfully get menu items by menu section', async () => {
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuItemModel.getMenuItemsByMenuSection(MENU_SECTION);

      expect(rawQuery).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while getting menu items by menu section id', async () => {
      try {
        await menuItemModel.getMenuItemsByMenuSection(MENU_SECTION);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('defaults includeHidden to false when not passed', async () => {
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuItemModel.getMenuItemsByMenuSection(MENU_SECTION);

      expect(rawQuery).toHaveBeenCalledWith(expect.any(String), { menuSectionID: MENU_SECTION, includeHidden: false });
    });
    it('passes includeHidden through to the query -- Otter push needs hidden modifiers/groups INCLUDED (not omitted, which would tell Otter to delete them)', async () => {
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuItemModel.getMenuItemsByMenuSection(MENU_SECTION, true);

      expect(rawQuery).toHaveBeenCalledWith(expect.any(String), { menuSectionID: MENU_SECTION, includeHidden: true });
    });
  });
  describe('getMenuItemsEntitiesByMenuSectionID', () => {
    const MENU_SECTION_ID = 275;
    const MENU_ITEMS = [
      {
        menu_item_id: 4,
        name: 'Burger',
      },
    ];
    it('should get menu items linked by menuSectionID', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS);

      await menuItemModel.getMenuItemsEntitiesByMenuSectionID(MENU_SECTION_ID);
      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status error if any error occurs', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await menuItemModel.getMenuItemsEntitiesByMenuSectionID(MENU_SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateMenuItemsListOrder', () => {
    const MENU_ITEMS = [
      {
        menu_item_id: 2,
        list_order: 0,
      },
      {
        menu_item_id: 1,
        list_order: 1,
      },
      {
        menu_item_id: 3,
        list_order: 2,
      },
    ];
    it('should update menu items list order', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      (save as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS);

      await menuItemModel.updateMenuItemsListOrder(MENU_ITEMS);
      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException error if any error occurs', async () => {
      const save = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      try {
        await menuItemModel.updateMenuItemsListOrder(MENU_ITEMS);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });

  describe('hideMenuItem', () => {
    const MENU_ITEM_ID = 345;
    const HIDE = true;
    it('should hide menu item', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      (update as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuItemModel.hideMenuItem(MENU_ITEM_ID, HIDE);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException error if any error occurs', async () => {
      const update = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await menuItemModel.hideMenuItem(MENU_ITEM_ID, HIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenuItemsOfMenuSectionByMenuItemID', () => {
    const MENU_ITEM_ID = 345;
    it('should get menu items of menu section based on menu item id of a menu item within that section', async () => {
      const MENU_ITEM = {
        menu_item_id: MENU_ITEM_ID,
        menu_item_url_id: 'fgfd-453-fgdf',
        name: 'Test Item',
        description: 'Test description',
        image_url: null,
        category: 'food',
        menu_section_id: 1,
        list_order: 0,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        deleted: false,
        base_item_size_id: 50,
      };

      const getRepository = jest.fn();
      const getMany = jest.fn();
      const orderBy = jest.fn(() => ({ getMany }));
      const andWhere = jest.fn(() => ({ orderBy }));
      const where = jest.fn(() => ({ andWhere }));
      const leftJoinAndSelect = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({ leftJoinAndSelect }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEM as MenuItemEntity);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await menuItemModel.getMenuItemsOfMenuSectionByMenuItemID(MENU_ITEM_ID);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MENU_ITEM);
    });
    it('should throw 500 HttpException error if any error occurs', async () => {
      const getMany = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getMany,
      });

      try {
        await menuItemModel.getMenuItemsOfMenuSectionByMenuItemID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getLargestListOrderInMenuSection', () => {
    const MENU_SECTION_ID = 1;
    it('should get menu items of menu section based on menu item id of a menu item within that section', async () => {
      const mockLargestListOrderResult = {
        maxListOrderValue: 100,
      };

      const getRepository = jest.fn();
      const getRawOne = jest.fn();
      const andWhere = jest.fn(() => ({ getRawOne }));
      const where = jest.fn(() => ({ andWhere }));
      const select = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({ select }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getRawOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockLargestListOrderResult);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await menuItemModel.getLargestListOrderInMenuSection(MENU_ITEM_ID);
      expect(getRawOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLargestListOrderResult.maxListOrderValue);
    });
    it('should throw 500 HttpException error if any error occurs', async () => {
      const getRawOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRawOne,
      });

      try {
        await menuItemModel.getLargestListOrderInMenuSection(MENU_SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
