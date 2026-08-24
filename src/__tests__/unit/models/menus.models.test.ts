import { CreateMenusDBInterface, Menus, MenusDBInterface, EditMenuRequestInterface } from '@/interfaces/menus.interface';
import { MenuDisclaimerModelInterface } from '@/interfaces/disclaimers.interface';
import MenusModel from '@/models/menus.model';
import MenuHoursService from '@services/menuHours.service';
import { MenuHoursModelInterface } from '@interfaces/menuHours.interface';
import MenuSectionsService from '@services/menuSections.service';
import { MenuSectionsModelInterface } from '@interfaces/menuSections.interface';
import { ormConnection } from '@utils/dbUtils';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { HttpException } from '@exceptions/HttpException';
import MenuDisclaimersService from '@/services/menuDisclaimers.service';
import SoftDeleteService from '@/services/softDelete.service';
import { SoftDeleteModelInterface } from '@/interfaces/softDelete.interface';
import { EntityManager } from 'typeorm';

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

jest.mock('@/services/menuHours.service', () => {
  const mockMenuHoursService = {
    insertMenuHours: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuHoursService) };
});
jest.mock('@/services/menuSections.service', () => {
  const mockMenuSectionsService = {
    insertMenuSections: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuSectionsService) };
});

const mockMenuHoursService = new MenuHoursService({} as MenuHoursModelInterface);
const mockMenuSectionService = new MenuSectionsService({} as MenuSectionsModelInterface);
const mockMenuDisclaimerService = new MenuDisclaimersService({} as MenuDisclaimerModelInterface);
const mockSoftDeleteService = new SoftDeleteService({} as SoftDeleteModelInterface);

const menusModel = new MenusModel(mockMenuHoursService, mockMenuSectionService, mockMenuDisclaimerService, mockSoftDeleteService);
describe('menusModel', () => {
  const RESTAURANT_ID = 1;
  const MOCK_MENU: Menus = {
    name: 'Test Menu 13',
    isPrixFixe: false,
    menuHours: [
      { day: 'Monday', start: '08:00', end: '20:00' },
      { day: 'Tuesday', start: '08:00', end: '20:00' },
      { day: 'Wednesday', start: '08:00', end: '20:00' },
      { day: 'Thursday', start: '08:00', end: '20:00' },
      { day: 'Friday', start: '08:00', end: '20:00' },
      { day: 'Saturday', start: '08:00', end: '20:00' },
      { day: 'Sunday', start: '08:00', end: '20:00' },
    ],
    menuSections: [
      {
        name: 'test menu section',
        message: 'test message',
      },
      {
        name: 'test menu section 2',
      },
    ],
    disclaimers: [
      {
        message: 'TEST',
        position: 'menu top bar',
      },
    ],
  };
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertMenuTransaction', () => {
    it('should start an insert menu transaction', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction: jest.fn(),
      });

      await menusModel.insertMenuTransaction(MOCK_MENU as Menus, RESTAURANT_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertMenu', () => {
    it('should insert menu successfully', async () => {
      const expectedResponse: CreateMenusDBInterface = {
        menu_id: 1035,
        name: 'Test Menu 13',
        is_prix_fixe: false,
        restaurant_id: 1,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        list_order: 5,
        menuSections: [
          {
            menu_section_id: 1068,
            name: 'test menu section',
            menu_id: 1035,
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
            list_order: 0,
          },
          {
            menu_section_id: 1069,
            name: 'test menu section 2',
            menu_id: 1035,
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
            list_order: 1,
          },
        ],
        menuHours: [
          {
            id: 1191,
            menu_id: 1035,
            day: 'Monday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
          {
            id: 1192,
            menu_id: 1035,
            day: 'Tuesday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
          {
            id: 1193,
            menu_id: 1035,
            day: 'Wednesday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
          {
            id: 1194,
            menu_id: 1035,
            day: 'Thursday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
          {
            id: 1195,
            menu_id: 1035,
            day: 'Friday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
          {
            id: 1196,
            menu_id: 1035,
            day: 'Saturday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
          {
            id: 1197,
            menu_id: 1035,
            day: 'Sunday',
            start: '08:00',
            end: '20:00',
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
          },
        ],
        disclaimers: [
          {
            message: 'TEST',
            message_id: 17,
            menu_id: 1035,
            message_type_id: 1,
          },
        ],
      };

      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        insert,
      };
      const result = await menusModel.insertMenu(MOCK_MENU as Menus, RESTAURANT_ID, REPOSITORY as PostgresQueriesRepository);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting menu ', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await menusModel.insertMenu(MOCK_MENU as Menus, RESTAURANT_ID, REPOSITORY as PostgresQueriesRepository);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMenuByMenuIDAndRestaurantID', () => {
    it('should successfully get menu by menuID and restaurantID', async () => {
      const MENU_ID = 1;
      const RESTAURANT_ID = 2;
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      const expectedResponse: MenusDBInterface[] = [
        {
          menu_id: 1,
          name: 'test menu',
          is_prix_fixe: false,
          restaurant_id: 2,
          list_order: 0,
          created_at: '2022-02-16',
          updated_at: '2022-02-16',
        },
      ];
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(expectedResponse);

      const menuResult = await menusModel.getMenuByMenuIDAndRestaurantID(MENU_ID, RESTAURANT_ID);
      expect(menuResult).toEqual(expectedResponse);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should not get menu by menuID and restaurantID and throw error', async () => {
      const MENU_ID = 1;
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      try {
        await menusModel.getMenuByMenuIDAndRestaurantID(MENU_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenu', () => {
    it('should hard delete menu by menu id', async () => {
      const mockMenuID = 1;
      const mockRestaurantID = 1;

      const deleteSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      await menusModel.deleteMenu(mockMenuID, mockRestaurantID);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu and throw error', async () => {
      const mockMenuID = 1;
      const mockRestaurantID = 1;
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      await expect(menusModel.deleteMenu(mockMenuID, mockRestaurantID)).rejects.toThrow(HttpException);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('editMenu', () => {
    const mockMenu = {
      menuID: 1013,
      name: 'EDIT Name',
      isPrixFixe: true,
      disclaimers: {
        DELETE: [2],
        INSERT: [
          {
            message: 'INSERT disclaimer',
            position: 'menu top bar',
          },
        ],
        UPDATE: [
          {
            message: 'UPDATE bottom disclaimer',
            messageID: 1,
          },
        ],
      },
      menuHours: [
        { day: 'Monday', start: '10:00', end: '23:00' },
        { day: 'Tuesday', start: '10:00', end: '23:00' },
        { day: 'Wednesday', start: '10:00', end: '23:00' },
        { day: 'Thursday', start: '10:00', end: '23:00' },
      ],
    };
    it('should start a edit menu transaction', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menusModel.editMenu(mockMenu as EditMenuRequestInterface);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while editing menu ', async () => {
      const transaction = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menusModel.editMenu(mockMenu as EditMenuRequestInterface);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateMenuNameAndPrixFixeByMenuID', () => {
    const MENU_ID = 1;
    const NAME = 'TEST';
    it('should successfully update menu name by menu id', async () => {
      const update = jest.fn();
      const REPOSITORY: any = {
        update,
      };
      (update as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menusModel.updateMenuNameAndPrixFixeByMenuID(MENU_ID, NAME, false, REPOSITORY as EntityManager);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating menu name by menu id', async () => {
      const update = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        update,
      };

      try {
        await menusModel.updateMenuNameAndPrixFixeByMenuID(MENU_ID, NAME, false, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenuByMenuID', () => {
    const MENU_ID = 1;
    it('should successfully get menu by menu id', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menusModel.getMenuByMenuID(MENU_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while getting menu by menu id', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await menusModel.getMenuByMenuID(MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenusEntitiesByRestaurantID', () => {
    const RESTAURANT_ID = 1;
    const MENUS = [
      {
        menu_id: 4,
        name: 'Lunch',
      },
    ];
    it('should get menu(s) linked by restaurantID', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(MENUS);

      await menusModel.getMenusEntitiesByRestaurantID(RESTAURANT_ID);
      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while getting menus by restaurant id', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await menusModel.getMenusEntitiesByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(find).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateMenusListOrder', () => {
    const MENUS = [
      {
        menu_id: 2,
        list_order: 0,
      },
      {
        menu_id: 1,
        list_order: 1,
      },
      {
        menu_id: 3,
        list_order: 2,
      },
    ];
    it('should update menus list order', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      (save as jest.MockedFunction<any>).mockResolvedValueOnce(MENUS);

      await menusModel.updateMenusListOrder(MENUS);
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
        await menusModel.updateMenusListOrder(MENUS);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('hideMenu', () => {
    const MENU_ID = 1;
    const HIDE = true;
    it('should hide menu', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      (update as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menusModel.hideMenu(MENU_ID, HIDE);
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
        await menusModel.hideMenu(MENU_ID, HIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
