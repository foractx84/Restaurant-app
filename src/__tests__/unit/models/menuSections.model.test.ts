import MenuSectionsModel from '@/models/menuSections.model';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { MenuSectionsDBInterface } from '@interfaces/menuSections.interface';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';

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

const menuSectionsModel = new MenuSectionsModel();
describe('menuSectionsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('insertAllMenuSections', () => {
    const MENU_ID = 1035;
    const MENU_SECTIONS: MenuSectionEntity[] = [
      {
        menu_section_id: null,
        name: 'test menu section',
        menu_id: MENU_ID,
        created_at: null,
        updated_at: null,
        list_order: null,
        deleted: false,
        message: '',
        is_hidden: false,
      },
      {
        menu_section_id: null,
        name: 'test menu section 2',
        menu_id: MENU_ID,
        created_at: null,
        updated_at: null,
        list_order: null,
        deleted: false,
        message: '',
        is_hidden: false,
      },
    ];
    it('should insert menu sections successfully', async () => {
      const expectedResponse: MenuSectionsDBInterface[] = [
        {
          menu_section_id: 1068,
          name: 'test menu section',
          menu_id: MENU_ID,
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
          list_order: 0,
        },
        {
          menu_section_id: 1069,
          name: 'test menu section 2',
          menu_id: MENU_ID,
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
          list_order: 1,
        },
      ];

      const insert = jest.fn().mockResolvedValue({ raw: expectedResponse });
      const REPOSITORY: any = {
        insert,
      };
      const result = await menuSectionsModel.insertAllMenuSections(MENU_SECTIONS, REPOSITORY as PostgresQueriesRepository);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
  });
  describe('findMenuSectionEntityByID', () => {
    it('should find menu section by id successfully', async () => {
      const MENU_SECTION_ID = 123;
      const MENU_SECTION: MenuSectionEntity = {
        menu_section_id: MENU_SECTION_ID,
        name: 'test menu section',
        menu_id: 1234,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        list_order: 0,
        deleted: false,
        message: '',
        is_hidden: false,
      };

      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_SECTION);

      const result = await menuSectionsModel.findMenuSectionEntityByID(MENU_SECTION_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MENU_SECTION);
    });
  });
  describe('deleteMenuSection', () => {
    const MENU_SECTION_ID = 123;
    it('should delete menu section by menu section id', async () => {
      const deleteSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      await menuSectionsModel.deleteMenuSection(MENU_SECTION_ID);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while deleting menu section by id', async () => {
      const deleteSpy = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      try {
        await menuSectionsModel.deleteMenuSection(MENU_SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('findMenuSectionByIDAndRestaurantID', () => {
    it('should find menu section linked with restaurant id successfully', async () => {
      const MENU_SECTION_ID = 6;
      const RESTAURANT_ID = 1;
      const mockMenuSectionJoinedWithRestaurant = {
        menu_section_id: MENU_SECTION_ID,
        name: 'test menu section',
        menu_id: 1234,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        list_order: 0,
        restaurant_id: RESTAURANT_ID,
      };

      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere2 = jest.fn(() => ({ getOne }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ where: where1 }));
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
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSectionJoinedWithRestaurant);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await menuSectionsModel.findMenuSectionByIDAndRestaurantID(MENU_SECTION_ID, RESTAURANT_ID);
      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMenuSectionJoinedWithRestaurant);
    });
  });
  describe('getMenuSectionsByMenuID', () => {
    const MENU_ID = 275;
    const MENU_SECTION = [
      {
        menu_section_id: 4,
        section_name: 'Pasta',
        message: '',
      },
    ];
    it('should get menu sections linked by menuID', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_SECTION);

      await menuSectionsModel.getMenuSectionsByMenuID(MENU_ID);
      expect(find).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateMenuSectionsListOrder', () => {
    const MENU_SECTION = [
      {
        menu_section_id: 2,
        list_order: 0,
      },
      {
        menu_section_id: 1,
        list_order: 1,
      },
      {
        menu_section_id: 3,
        list_order: 2,
      },
    ];
    it('should update menu sections list order', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      (save as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_SECTION);

      await menuSectionsModel.updateMenuSectionsListOrder(MENU_SECTION);
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
        await menuSectionsModel.updateMenuSectionsListOrder(MENU_SECTION);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateMenuSectionName', () => {
    const MENU_ID = 275;
    const MENU_SECTION_NAME = 'Pasta';
    const MENU_SECTION = {
      menu_id: 275,
      menu_section_id: 1,
      section_name: 'Pasta',
    };
    const MESSAGE = 'test_message';
    it('should update menu section name by menuSectionID when no EntityManager repository is provided', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      (update as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_SECTION);

      await menuSectionsModel.updateMenuSectionName(MENU_ID, MENU_SECTION_NAME);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should update menu section name by menuSectionID when EntityManager repository is provided and message is provided', async () => {
      const update = jest.fn();
      const REPOSITORY: any = {
        update,
      };

      await menuSectionsModel.updateMenuSectionName(MENU_ID, MENU_SECTION_NAME, MESSAGE, REPOSITORY);
      expect(update).toHaveBeenCalledTimes(1);
    });
  });
  describe('hideMenuSection', () => {
    const MENU_SECTION_ID = 1;
    const HIDE = true;
    it('should hide menu section', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      (update as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuSectionsModel.hideMenuSection(MENU_SECTION_ID, HIDE);
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
        await menuSectionsModel.hideMenuSection(MENU_SECTION_ID, HIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
