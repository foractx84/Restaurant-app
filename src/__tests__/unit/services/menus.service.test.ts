import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  CreateOneMenuInterface,
  CreateMenusRequestInterface,
  CreateMenusDBInterface,
  MenusDBInterface,
  EditMenuRequestInterface,
} from '@/interfaces/menus.interface';
import MenusModel from '@/models/menus.model';
import MenusService from '@/services/menus.service';
import MenuHoursService from '@services/menuHours.service';
import { MenuHoursModelInterface } from '@interfaces/menuHours.interface';
import MenuSectionsService from '@services/menuSections.service';
import { GetMenuSectionsForMenuDetailsInterface, MenuSectionsModelInterface } from '@interfaces/menuSections.interface';
import MenuDisclaimersService from '@/services/menuDisclaimers.service';
import { MenuDisclaimerModelInterface } from '@/interfaces/disclaimers.interface';
import SoftDeleteService from '@/services/softDelete.service';
import SoftDeleteModel from '@/models/softDelete.model';
import MenuItemService from '@/services/menuItem.service';
import { AggregateServiceInterface } from '@/interfaces/aggregate.interface';
import { DietaryRestrictionsServiceInterface } from '@/interfaces/dietaryRestrictions.interface';
import { ItemSizeServiceInterface } from '@/interfaces/itemSize.interface';
import { MenuItemModelInterface } from '@/interfaces/menuItem.interface';
import { RestaurantsServiceInterface } from '@/interfaces/restaurants.interface';
import { ormConnection } from '@/utils/dbUtils';
import { TagsServiceInterface } from '@/interfaces/tags.interface';
import { DrinkItemServiceInterface } from '@interfaces/drinkItem.interface';
import { MenuItemMediaServiceInterface } from '@/interfaces/menuItemMedia.interface';
import { buildFileURL, createMenuDoc_docx, generatePDFBuffer_PDF_Kit, uploadFileToGoogleCloud } from '@/utils/fileUtils';
import { FileGenerationType } from '@/enums/fileGenerationType';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));

jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    FILE_HOSTING_URL: 'https://trytaptab.com/files/',
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});
jest.mock('@/utils/fileUtils', () => {
  const mockFileUtils = {
    createMenuDoc_docx: jest.fn(),
    generatePDFBuffer_PDF_Kit: jest.fn(),
    uploadFileToGoogleCloud: jest.fn(),
    buildFileURL: jest.fn(),
  };
  return {
    __esModule: true,
    createMenuDoc_docx: jest.fn(),
    generatePDFBuffer_PDF_Kit: jest.fn(),
    uploadFileToGoogleCloud: jest.fn(),
    buildFileURL: jest.fn(),
    default: jest.fn(() => mockFileUtils),
  };
});
jest.mock('@/services/menuHours.service', () => {
  const mockMenuHoursService = {
    insertMenuHours: jest.fn(),
    getMenuHoursByMenuID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuHoursService) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/menuHours.model', () => {
  const mockMenuHoursModel = {
    getMenuHoursEntityByMenuID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuHoursModel) };
});
jest.mock('@/services/menuSections.service', () => {
  const mockMenuSectionsService = {
    insertMenuSections: jest.fn(),
    getMenuSectionsForMenuDetails: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuSectionsService) };
});
jest.mock('@/services/menuDisclaimers.service', () => {
  const mockMenuDisclaimersService = {
    getAllMenuDisclaimersByMenuID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuDisclaimersService) };
});
jest.mock('@/services/menuItem.service', () => {
  const mockMenuItemsService = {
    getMenuItemsByMenuSection: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemsService) };
});
// mock the menus model
jest.mock('@/models/menus.model', () => {
  const mockMenusModel = {
    editMenu: jest.fn(),
    insertMenu: jest.fn(),
    insertMenuTransaction: jest.fn(),
    deleteMenu: jest.fn(),
    getMenuByMenuID: jest.fn(),
    getMenuByMenuIDAndRestaurantID: jest.fn(),
    getMenusEntitiesByRestaurantID: jest.fn(),
    hideMenu: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenusModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
    rawQuery: jest.fn(),
  };
});

const mockMenuHoursService = new MenuHoursService({} as MenuHoursModelInterface);
const mockMenuSectionService = new MenuSectionsService({} as MenuSectionsModelInterface);
const mockMenuDisclaimerService = new MenuDisclaimersService({} as MenuDisclaimerModelInterface);
const mockSofDeleteService = new SoftDeleteService(new SoftDeleteModel());
const mockMenuItemService = new MenuItemService(
  {} as AggregateServiceInterface,
  {} as DietaryRestrictionsServiceInterface,
  {} as DrinkItemServiceInterface,
  {} as ItemSizeServiceInterface,
  {} as MenuItemModelInterface,
  {} as RestaurantsServiceInterface,
  {} as TagsServiceInterface,
  {} as MenuItemMediaServiceInterface,
);

// create mock menus model object
const mockMenusModel = new MenusModel(mockMenuHoursService, mockMenuSectionService, mockMenuDisclaimerService, mockSofDeleteService);
const menusService = new MenusService(mockMenusModel, mockMenuHoursService, mockMenuSectionService, mockMenuItemService, mockMenuDisclaimerService);

describe('menusService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createMenus', () => {
    const RESTAURANT_ID = 1;
    it('should successfully create a single menu', async () => {
      // mock model response
      const mockModelResponse: CreateMenusDBInterface = {
        menu_id: 1035,
        name: 'Test Menu 13',
        is_prix_fixe: false,
        restaurant_id: 1,
        list_order: 0,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        menuSections: [
          {
            menu_section_id: 1068,
            name: 'test menu section',
            menu_id: 1035,
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
            list_order: 0,
            message: 'test menu section message',
          },
          {
            menu_section_id: 1069,
            name: 'test menu section 2',
            menu_id: 1035,
            created_at: '2022-02-02T02:44:11.950Z',
            updated_at: '2022-02-02T02:44:11.950Z',
            list_order: 1,
            message: null,
          },
        ],
        menuHours: [
          {
            id: 1191,
            day: 'Monday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1192,
            day: 'Tuesday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1193,
            day: 'Wednesday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1194,
            day: 'Thursday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1195,
            day: 'Friday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1196,
            day: 'Saturday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1197,
            day: 'Sunday',
            start: '08:00',
            end: '20:00',
          },
        ],
        disclaimers: [
          {
            message: 'TEST',
            message_id: 17,
            menu_id: 1035,
            message_type_id: 1,
          },
          {
            message: 'TEST BOTTOM MENU DISCLAIMER',
            message_id: 18,
            menu_id: 1035,
            message_type_id: 2,
          },
        ],
      };
      const expectedResponse: CreateOneMenuInterface = {
        menuID: 1035,
        name: 'Test Menu 13',
        isPrixFixe: false,
        restaurantID: 1,
        menuSections: [
          {
            menuSectionID: 1068,
            name: 'test menu section',
            message: 'test menu section message',
          },
          {
            menuSectionID: 1069,
            name: 'test menu section 2',
            message: '',
          },
        ],
        menuHours: [
          {
            id: 1191,
            day: 'Monday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1192,
            day: 'Tuesday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1193,
            day: 'Wednesday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1194,
            day: 'Thursday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1195,
            day: 'Friday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1196,
            day: 'Saturday',
            start: '08:00',
            end: '20:00',
          },
          {
            id: 1197,
            day: 'Sunday',
            start: '08:00',
            end: '20:00',
          },
        ],
        disclaimers: [
          {
            message: 'TEST',
            messageID: 17,
            position: 'menu top bar',
          },
          {
            message: 'TEST BOTTOM MENU DISCLAIMER',
            messageID: 18,
            position: 'menu bottom bar',
          },
        ],
      };

      // set up mock menus model to return our mock response to service
      (mockMenusModel.insertMenuTransaction as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      // mock function params
      const mockMenus: CreateMenusRequestInterface = {
        menus: [
          {
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
              {
                message: 'TEST BOTTOM MENU DISCLAIMER',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };
      // call on the service like the controller would
      const result = await menusService.createMenus(mockMenus, RESTAURANT_ID);
      // enforce test expectations
      expect(mockMenusModel.insertMenuTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ menus: [expectedResponse] });
    });
    it('should throw HttpException no matter exception captured when menu fails to create', async () => {
      const mockMenus: any = {};

      (mockMenusModel.insertMenuTransaction as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Input value could not create menu'));
      });
      await expect(menusService.createMenus(mockMenus, RESTAURANT_ID)).rejects.toThrow(HttpException);
    });
  });
  describe('deleteMenus', () => {
    it('should successfully delete menu', async () => {
      const MENU_ID = 1;
      const RESTAURANT_ID = 1;

      const mockGetMenuResponse: MenusDBInterface = {
        menu_id: 1,
        name: 'Menu to delete',
        restaurant_id: 1,
        list_order: 0,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      };

      (mockMenusModel.getMenuByMenuIDAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponse);
      (mockMenusModel.deleteMenu as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await menusService.deleteMenu(MENU_ID, RESTAURANT_ID);

      expect(mockMenusModel.getMenuByMenuIDAndRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockMenusModel.deleteMenu).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu since it does not exist in database', async () => {
      const MENU_ID = 1;
      const RESTAURANT_ID = 1;

      (mockMenusModel.getMenuByMenuIDAndRestaurantID as jest.MockedFunction<any>).mockImplementationOnce({});

      await expect(menusService.deleteMenu(MENU_ID, RESTAURANT_ID)).rejects.toThrow(HttpException);

      expect(mockMenusModel.getMenuByMenuIDAndRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockMenusModel.deleteMenu).toHaveBeenCalledTimes(0);
    });
  });
  describe('editMenu', () => {
    const mockMenuRequest: EditMenuRequestInterface = {
      menuID: 14,
      name: 'Test Menu 31',
      isPrixFixe: false,
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
        { day: 'Monday', start: '08:00', end: '20:00' },
        { day: 'Tuesday', start: '08:00', end: '20:00' },
        { day: 'Wednesday', start: '08:00', end: '20:00' },
        { day: 'Thursday', start: '08:00', end: '20:00' },
        { day: 'Friday', start: '08:00', end: '20:00' },
        { day: 'Saturday', start: '08:00', end: '20:00' },
        { day: 'Sunday', start: '08:00', end: '20:00' },
      ],
    };
    const mockMenuRequestNoInsertDisclaimers: EditMenuRequestInterface = {
      menuID: 14,
      name: 'Test Menu 31',
      isPrixFixe: false,
      disclaimers: {
        DELETE: [2],
        INSERT: [],
        UPDATE: [
          {
            message: 'UPDATE bottom disclaimer',
            messageID: 1,
          },
        ],
      },
      menuHours: [
        { day: 'Monday', start: '08:00', end: '20:00' },
        { day: 'Tuesday', start: '08:00', end: '20:00' },
        { day: 'Wednesday', start: '08:00', end: '20:00' },
        { day: 'Thursday', start: '08:00', end: '20:00' },
        { day: 'Friday', start: '08:00', end: '20:00' },
        { day: 'Saturday', start: '08:00', end: '20:00' },
        { day: 'Sunday', start: '08:00', end: '20:00' },
      ],
    };
    it('should successfully call edit menu', async () => {
      const mockInsertedMenuDisclaimersResponse = {
        insertedDisclaimers: [
          {
            messageID: 1,
            position: 'menu top bar',
            message: 'inserted top disclaimer',
          },
        ],
      };
      (mockMenusModel.editMenu as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimersResponse);

      const result = await menusService.editMenu(mockMenuRequest);

      expect(mockMenusModel.editMenu).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockInsertedMenuDisclaimersResponse);
    });
    it('should successfully call edit menu with no disclaimers to insert, and return empty inserted disclaimers', async () => {
      const mockInsertedMenuDisclaimersResponse = {
        insertedDisclaimers: [],
      };
      (mockMenusModel.editMenu as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimersResponse);

      const result = await menusService.editMenu(mockMenuRequestNoInsertDisclaimers);

      expect(mockMenusModel.editMenu).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockInsertedMenuDisclaimersResponse);
    });
    it('should throw HTTP Exception if any uncaught error occurs while editing menu', async () => {
      (mockMenusModel.editMenu as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while editing menu. Refer to the logs for more detail'),
        );
      });

      try {
        await menusService.editMenu(mockMenuRequest);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 409 Duplication if HTTP exception if menu name already exists for edited menu', async () => {
      try {
        await menusService.editMenu(mockMenuRequest);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenuDetails', () => {
    const MENU_ID = 275;
    const RESTAURANT_ID = 1;
    const mockGetMenuResponse = {
      menu_id: 275,
      name: 'Lunch',
      is_prix_fixe: false,
      restaurant_id: RESTAURANT_ID,
    };
    const mockMenuHours = {
      start: '06:00',
      end: '20:00',
      day: 'Friday',
    };
    const mockMenuDisclaimers = [
      {
        messageID: 10,
        menuID: 275,
        message: 'test disclaimer',
        position: 'menu top bar',
      },
      {
        messageID: 11,
        menuID: 275,
        message: 'test disclaimer bottom',
        position: 'menu bottom bar',
      },
    ];
    const mockMenuSections = [
      {
        menuItemID: 275,
        allItemSizes: [
          {
            id: 11,
            label: 'small',
            price: 3800,
            priceOverride: '',
          },
          {
            id: 12,
            label: 'large',
            price: 4000,
            priceOverride: '',
          },
        ],
        baseItemSize: {
          id: 11,
          label: 'small',
          price: 3800,
          priceOverride: '',
        },
        dietaryRestrictions: [
          {
            restrictionID: 4,
            name: 'Fish',
          },
          {
            restrictionID: 6,
            name: 'Gluten',
          },
        ],
        baseItemSizeID: 11,
        calories: 100,
      },
    ];
    const mockMenuItems = {
      menuSectionID: 5,
      sectionName: 'Lunch',
      message: 'test message',
      items: mockMenuSections,
    };
    it('should successfully get menu details', async () => {
      const expectedResponse = {
        menuID: 275,
        menuName: 'Lunch',
        isPrixFixe: false,
        restaurantID: RESTAURANT_ID,
        messages: mockMenuDisclaimers,
        menuSections: mockMenuSections,
        menuHours: [mockMenuHours],
      };

      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponse);
      (mockMenuHoursService.getMenuHoursByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce([mockMenuHours]);
      const find = jest.fn().mockResolvedValueOnce([mockMenuHours]);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ find });
      (mockMenuDisclaimerService.getAllMenuDisclaimersByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimers);
      (mockMenuSectionService.getMenuSectionsForMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSections);
      (mockMenuItemService.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuItems);

      const result = await menusService.getMenuDetails(MENU_ID);

      expect(result).toEqual(expectedResponse);
      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuHoursService.getMenuHoursByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuDisclaimerService.getAllMenuDisclaimersByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemService.getMenuItemsByMenuSection).toHaveBeenCalledTimes(1);
    });
    it('get menu details throw HttpException 500 status code error', async () => {
      (mockMenusModel.getMenuByMenuIDAndRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menusService.getMenuDetails(MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('get menu details throw HttpException 404 if menu doesnt exist in database', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      try {
        await menusService.getMenuDetails(MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should successfully get menu details when isPrixFixe = true', async () => {
      const mockGetMenuResponsePrix = {
        menu_id: 275,
        name: 'Lunch',
        is_prix_fixe: true,
        restaurant_id: RESTAURANT_ID,
      };
      const mockMenuSectionsPrix = [
        {
          menuItemID: 275,
          allItemSizes: [
            {
              id: 11,
              label: 'small',
              price: 3800,
              priceOverride: 'prix',
            },
            {
              id: 12,
              label: 'large',
              price: 4000,
              priceOverride: 'prix',
            },
          ],
          baseItemSize: {
            id: 11,
            label: 'small',
            price: 3800,
            priceOverride: 'prix',
          },
          dietaryRestrictions: [
            {
              restrictionID: 4,
              name: 'Fish',
            },
            {
              restrictionID: 6,
              name: 'Gluten',
            },
          ],
          baseItemSizeID: 11,
        },
      ];
      const mockMenuItemsPrix = {
        menuSectionID: 5,
        sectionName: 'Lunch',
        items: mockMenuSectionsPrix,
      };

      const expectedResponsePrix = {
        menuID: 275,
        menuName: 'Lunch',
        isPrixFixe: true,
        restaurantID: RESTAURANT_ID,
        messages: mockMenuDisclaimers,
        menuSections: mockMenuSectionsPrix,
        menuHours: [mockMenuHours],
      };

      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponsePrix);
      (mockMenuHoursService.getMenuHoursByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce([mockMenuHours]);
      const find = jest.fn().mockResolvedValueOnce([mockMenuHours]);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ find });
      (mockMenuDisclaimerService.getAllMenuDisclaimersByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimers);
      (mockMenuSectionService.getMenuSectionsForMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSectionsPrix);
      (mockMenuItemService.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuItemsPrix);

      const result = await menusService.getMenuDetails(MENU_ID);

      expect(result).toEqual(expectedResponsePrix);
      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuHoursService.getMenuHoursByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuDisclaimerService.getAllMenuDisclaimersByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemService.getMenuItemsByMenuSection).toHaveBeenCalledTimes(1);
    });
  });
  describe('reorder', () => {
    const RESTAURANT_ID = 1;
    const correctMenusOrder = [4, 1, 3, 2];
    const wrongValuesMenusOrder = [4, 1, 3, 5];
    const missingValuesMenusOrder = [4, 3, 4];
    const extraValuesMenusOrder = [4, 1, 3, 5, 2];
    const duplicateValuesMenusOrder = [4, 1, 3, 3, 2];
    const mockExistingMenus = [
      {
        menu_id: 1,
      },
      {
        menu_id: 2,
      },
      {
        menu_id: 3,
      },
      {
        menu_id: 4,
      },
    ];
    it('should successfully reorder menus by restaurantID by calling transaction', async () => {
      (mockMenusModel.getMenusEntitiesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenus);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menusService.reorderMenus(RESTAURANT_ID, correctMenusOrder);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while reordering menus of a restaurant', async () => {
      (mockMenusModel.getMenusEntitiesByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menusService.reorderMenus(RESTAURANT_ID, correctMenusOrder);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menus in request body have less than exist in restaurant', async () => {
      (mockMenusModel.getMenusEntitiesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenus);

      try {
        await menusService.reorderMenus(RESTAURANT_ID, missingValuesMenusOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menus in request body have extra menus than exist in restaurant', async () => {
      (mockMenusModel.getMenusEntitiesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenus);

      try {
        await menusService.reorderMenus(RESTAURANT_ID, extraValuesMenusOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if duplicate menus', async () => {
      (mockMenusModel.getMenusEntitiesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenus);

      try {
        await menusService.reorderMenus(RESTAURANT_ID, duplicateValuesMenusOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menus in body request dont match with menus of a restaurantID', async () => {
      (mockMenusModel.getMenusEntitiesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenus);

      try {
        await menusService.reorderMenus(RESTAURANT_ID, wrongValuesMenusOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
      }
    });
  });
  describe('hideMenu', () => {
    const MENU_ID = 1;
    const HIDE = true;
    it('should successfully hide menu by menuID', async () => {
      (mockMenusModel.hideMenu as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menusService.hideMenu(MENU_ID, HIDE);
      expect(mockMenusModel.hideMenu).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while hiding menu', async () => {
      (mockMenusModel.hideMenu as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menusService.hideMenu(MENU_ID, HIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('generateFile', () => {
    const MENU_ID = 1;
    const RESTAURANT_ID = 1;
    const mockGetMenuResponse = {
      menu_id: 275,
      name: 'Lunch',
      is_prix_fixe: false,
      restaurant_id: RESTAURANT_ID,
    };
    const mockMenuSections: GetMenuSectionsForMenuDetailsInterface[] = [
      {
        menuSectionID: 123,
        sectionName: 'Test Section',
        isHidden: false,
        message: '',
        items: [],
      },
    ];
    const mockMenuItems = {
      menuSectionID: 5,
      sectionName: 'Lunch',
      message: 'test message',
      items: mockMenuSections,
    };
    const PDF_FORMAT = FileGenerationType.PDF;
    const DOCX_FORMAT = FileGenerationType.DOCX;
    const RESULT_PDF = `https://trytaptab.com/files/test.pdf`;
    const RESULT_DOCX = `https://trytaptab.com/files/test.docx`;
    it('should successfully fetch menu, generate a pdf file, and upload to GCP', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponse);
      (mockMenuSectionService.getMenuSectionsForMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSections);
      (mockMenuItemService.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce([mockMenuItems]);
      (generatePDFBuffer_PDF_Kit as jest.MockedFunction<any>).mockResolvedValueOnce('data');
      (buildFileURL as jest.MockedFunction<any>).mockReturnValueOnce(RESULT_PDF);

      const result = await menusService.generateFile(PDF_FORMAT, MENU_ID);

      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemService.getMenuItemsByMenuSection).toHaveBeenCalledTimes(1);
      expect(generatePDFBuffer_PDF_Kit).toHaveBeenCalledTimes(1);
      expect(createMenuDoc_docx).not.toHaveBeenCalledTimes(1);
      expect(uploadFileToGoogleCloud).toHaveBeenCalledTimes(1);

      expect(result).toEqual({ fileURL: RESULT_PDF });
    });
    it('should successfully fetch menu, generate a docx file, and upload to GCP', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponse);
      (mockMenuSectionService.getMenuSectionsForMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSections);
      (mockMenuItemService.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce([mockMenuItems]);
      (generatePDFBuffer_PDF_Kit as jest.MockedFunction<any>).mockResolvedValueOnce('data');
      (buildFileURL as jest.MockedFunction<any>).mockReturnValueOnce(RESULT_DOCX);

      const result = await menusService.generateFile(DOCX_FORMAT, MENU_ID);

      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemService.getMenuItemsByMenuSection).toHaveBeenCalledTimes(1);
      expect(createMenuDoc_docx).toHaveBeenCalledTimes(1);
      expect(generatePDFBuffer_PDF_Kit).not.toHaveBeenCalledTimes(1);
      expect(uploadFileToGoogleCloud).toHaveBeenCalledTimes(1);

      expect(result).toEqual({ fileURL: RESULT_DOCX });
    });
    it('should throw a HttpException 404 status code if menu doesnt exist', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      try {
        await menusService.generateFile(PDF_FORMAT, MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).not.toHaveBeenCalled();
      expect(mockMenuItemService.getMenuItemsByMenuSection).not.toHaveBeenCalled();
      expect(generatePDFBuffer_PDF_Kit).not.toHaveBeenCalled();
      expect(createMenuDoc_docx).not.toHaveBeenCalledTimes(1);
      expect(uploadFileToGoogleCloud).not.toHaveBeenCalled();
    });
    it('should throw a HttpException 422 status code if menu doesnt have any menu sections', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponse);
      (mockMenuSectionService.getMenuSectionsForMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await menusService.generateFile(PDF_FORMAT, MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(422);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemService.getMenuItemsByMenuSection).not.toHaveBeenCalled();
      expect(generatePDFBuffer_PDF_Kit).not.toHaveBeenCalled();
      expect(createMenuDoc_docx).not.toHaveBeenCalledTimes(1);
      expect(uploadFileToGoogleCloud).not.toHaveBeenCalled();
    });
    it('should throw a HttpException 422 status code if menu doesnt have any menu items', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuResponse);
      (mockMenuSectionService.getMenuSectionsForMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSections);
      (mockMenuItemService.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      try {
        await menusService.generateFile(PDF_FORMAT, MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(422);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).toHaveBeenCalledTimes(1);
      expect(mockMenuItemService.getMenuItemsByMenuSection).toHaveBeenCalledTimes(1);
      expect(generatePDFBuffer_PDF_Kit).not.toHaveBeenCalled();
      expect(createMenuDoc_docx).not.toHaveBeenCalledTimes(1);
      expect(uploadFileToGoogleCloud).not.toHaveBeenCalled();
    });
    it('should throw a HttpException 500 status code if any error occurs while getting pdf of menu', async () => {
      (mockMenusModel.getMenuByMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menusService.generateFile(PDF_FORMAT, MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenusModel.getMenuByMenuID).toHaveBeenCalledTimes(1);
      expect(mockMenuSectionService.getMenuSectionsForMenuDetails).not.toHaveBeenCalled();
      expect(mockMenuItemService.getMenuItemsByMenuSection).not.toHaveBeenCalled();
      expect(generatePDFBuffer_PDF_Kit).not.toHaveBeenCalled();
      expect(createMenuDoc_docx).not.toHaveBeenCalledTimes(1);
      expect(uploadFileToGoogleCloud).not.toHaveBeenCalled();
    });
  });
});
