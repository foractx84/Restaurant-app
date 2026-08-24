import MenusController from '@/controllers/menus.controller';
import { MenuHoursServiceInterface } from '@/interfaces/menuHours.interface';
import { MenuItemServiceInterface } from '@/interfaces/menuItem.interface';
import { CreateAllMenusInterface, CreateOneMenuInterface } from '@/interfaces/menus.interface';
import { MenuSectionsServiceInterface } from '@/interfaces/menuSections.interface';
import { SoftDeleteServiceInterface } from '@/interfaces/softDelete.interface';
import SoftDeleteModel from '@/models/softDelete.model';
import MenusService from '@/services/menus.service';
import SoftDeleteService from '@/services/softDelete.service';
import { Request, Response, NextFunction } from 'express';
import MenusModel from '@/models/menus.model';
import { MenuDisclaimerServiceInterface } from '@/interfaces/disclaimers.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/menus.service', () => {
  const mockMenusService = {
    createMenus: jest.fn(),
    deleteMenu: jest.fn(),
    editMenu: jest.fn(),
    getMenuDetails: jest.fn(),
    generateFile: jest.fn(),
    hideMenu: jest.fn(),
    reorderMenus: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenusService) };
});
// mock the soft delete service
jest.mock('@/services/softDelete.service', () => {
  const mockSoftDeleteService = {
    softDeleteMenuByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSoftDeleteService) };
});
// mock menus service object
const mockMenusService = new MenusService(
  new MenusModel(
    {} as MenuHoursServiceInterface,
    {} as MenuSectionsServiceInterface,
    {} as MenuDisclaimerServiceInterface,
    {} as SoftDeleteServiceInterface,
  ),
  {} as MenuHoursServiceInterface,
  {} as MenuSectionsServiceInterface,
  {} as MenuItemServiceInterface,
  {} as MenuDisclaimerServiceInterface,
);
const mockSoftDeleteService = new SoftDeleteService(new SoftDeleteModel());
// create test controller object
const menusController = new MenusController(mockMenusService, mockSoftDeleteService);

// unit testing
describe('menusController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createMenus', () => {
    it('should successfully create menus', async () => {
      // mock the required response for the test
      const menus: CreateOneMenuInterface = {
        menuID: 1033,
        isPrixFixe: false,
        isHidden: false,
        name: 'Test Menu 13asffasefasfasfafdafaad',
        restaurantID: 1,
        createdAt: '2022-02-02T00:54:08.465Z',
        updatedAt: '2022-02-02T00:54:08.465Z',
        menuSections: [
          {
            menuSectionID: 1064,
            name: 'test menu section',
            menuID: 1033,
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
            listOrder: 0,
          },
          {
            menuSectionID: 1065,
            name: 'test menu section 2',
            menuID: 1033,
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
            listOrder: 1,
          },
        ],
        menuHours: [
          {
            id: 1177,
            menuID: 1033,
            day: 'Monday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
          {
            id: 1178,
            menuID: 1033,
            day: 'Tuesday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
          {
            id: 1179,
            menuID: 1033,
            day: 'Wednesday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
          {
            id: 1180,
            menuID: 1033,
            day: 'Thursday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
          {
            id: 1181,
            menuID: 1033,
            day: 'Friday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
          {
            id: 1182,
            menuID: 1033,
            day: 'Saturday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
          {
            id: 1183,
            menuID: 1033,
            day: 'Sunday',
            start: '08:00',
            end: '20:00',
            createdAt: '2022-02-02T00:54:08.465Z',
            updatedAt: '2022-02-02T00:54:08.465Z',
          },
        ],
        disclaimers: [
          {
            message: 'TEST',
            messageID: 17,
          },
        ],
      };
      const mockServiceResponse: CreateAllMenusInterface = {
        menus: [menus],
      };
      // set up mock menus service to return our mock response to controller
      (mockMenusService.createMenus as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);
      // mock a request needed by controller
      const mReq = {
        body: {
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
              menuSectionNames: ['test menu section', 'test menu section 2'],
            },
          ],
        },
      };
      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      // call on controller as the router would
      await menusController.createMenus(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenusService.createMenus).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create menu because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.createMenus(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenusService.createMenus).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteMenu', () => {
    it('should successfully delete menu', async () => {
      const mReq: Partial<Request> = {
        params: {
          menuID: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(() => {
          'Success!';
        }),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();
      await menusController.deleteMenu(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockSoftDeleteService.softDeleteMenuByID).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.deleteMenu(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockSoftDeleteService.softDeleteMenuByID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editMenus', () => {
    it('should successfully edit menus', async () => {
      const mockInsertDisclaimerResponse = {
        insertedDisclaimers: [
          {
            message: 'INSERT disclaimer',
            messageID: 3,
            position: 'menu top bar',
          },
        ],
      };
      // mock the required response for the test
      // set up mock menus service to return our mock response to controller
      (mockMenusService.editMenu as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertDisclaimerResponse);
      // mock a request needed by controller
      const mReq = {
        body: {
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
        },
      };

      // mock a response object for controller to return into
      let responseObject: any = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      // call on controller as the router would
      await menusController.editMenu(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenusService.editMenu).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockInsertDisclaimerResponse);
    });
    it('should not edit menu because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.editMenu(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenusService.editMenu).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getMenuDetails', () => {
    const MENU_ID = '275';
    const MENU_ID_NUMBER = 275;
    it('should successfully get menu details', async () => {
      const mockServiceResponse = {
        menuID: MENU_ID_NUMBER,
        menuName: 'All day',
        restaurantID: 1,
        isHidden: false,
        messages: [
          {
            message: 'Test Top',
            messageID: 23,
            position: 'menu top bar',
            menuID: MENU_ID_NUMBER,
          },
          {
            message: 'Test Bottom',
            messageID: 24,
            position: 'menu bottom bar',
            menuID: MENU_ID_NUMBER,
          },
        ],
        menuSections: [
          {
            menuSectionID: 3,
            sectionName: 'Meats',
            isHidden: false,
            items: [
              {
                name: "Snake River Farm's Kurobuta Pork Chop",
                description: 'Leeks | Smoked Peppers | Natural Jus',
                menuItemID: 359,
                calories: 100,
                category: 'food',
                createdAt: '2021-04-16T20:06:54.016592',
                updatedAt: '2022-04-01T18:14:21.262672',
                imageURL: 'https://resources.trytaptab.com/images/menu_items/8.jpg',
                dietaryRestrictions: [2],
                baseItemSize: {
                  id: 12,
                  label: '6oz',
                  price: 2900,
                  priceOverride: '',
                },
                allItemSizes: [
                  {
                    id: 12,
                    label: '6oz',
                    price: 2900,
                    priceOverride: '',
                  },
                  {
                    id: 13,
                    label: '10oz',
                    price: 3900,
                    priceOverride: '',
                  },
                ],
                pairings: [
                  {
                    drinkItemID: 1,
                    name: 'Test Drink',
                    isHidden: false,
                  },
                ],
              },
            ],
          },
          {
            menuSectionID: 7,
            sectionName: 'Sides',
            isHidden: false,
            items: [
              {
                name: 'Scarborough Farms Little Gems',
                description: 'Avocado | Sun Gold Tomatoes | Lemon Cucumber | Breakfast Radish',
                menuItemID: 380,
                calories: null,
                category: 'food',
                createdAt: '2021-04-16T22:50:57.690737',
                updatedAt: '2022-04-01T18:14:21.262672',
                imageURL: 'https://resources.trytaptab.com/images/menu_items/6.jpg',
                dietaryRestrictions: [
                  {
                    restrictionID: 4,
                    name: 'Pork',
                  },
                  {
                    restrictionID: 5,
                    name: 'Beef',
                  },
                ],
                baseItemSize: {
                  id: 6,
                  label: 'default',
                  price: 1900,
                  priceOverride: '',
                },
                allItemSizes: [
                  {
                    id: 6,
                    label: 'default',
                    price: 1900,
                    priceOverride: '',
                  },
                ],
                pairings: [],
              },
            ],
          },
        ],
        menuHours: [
          {
            day: 'Friday',
            start: '11:00',
            end: '23:00',
          },
          {
            day: 'Monday',
            start: '11:00',
            end: '23:00',
          },
          {
            day: 'Saturday',
            start: '11:00',
            end: '23:00',
          },
          {
            day: 'Sunday',
            start: '11:00',
            end: '23:00',
          },
          {
            day: 'Thursday',
            start: '11:00',
            end: '23:00',
          },
          {
            day: 'Tuesday',
            start: '11:00',
            end: '23:00',
          },
          {
            day: 'Wednesday',
            start: '11:00',
            end: '23:00',
          },
        ],
      };
      const mReq: Partial<Request> = {
        params: {
          menuID: MENU_ID,
        },
      };
      (mockMenusService.getMenuDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);
      let responseObject: any = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      await menusController.getMenuDetails(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockMenusService.getMenuDetails).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not get menu details because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.getMenuDetails(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenusService.getMenuDetails).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('reorderMenus', () => {
    it('should successfully reorder menus', async () => {
      const mReq: Partial<Request> = {
        body: {
          menusOrder: [3, 1, 2],
        },
      };
      (mockMenusService.reorderMenus as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menusController.reorderMenus(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenusService.reorderMenus).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not reorder menus because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.reorderMenus(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenusService.reorderMenus).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('hideMenu', () => {
    it('should successfully hide menu', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuID: 345,
          hide: true,
        },
      };
      (mockMenusService.hideMenu as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menusController.hideMenu(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenusService.hideMenu).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not hide menu because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.hideMenu(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenusService.hideMenu).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('generateFile', () => {
    const PDF = 'pdf';
    const DOCX = 'docx';
    const MENU_ID = 275;
    const PDF_FILE = 'some_file.pdf';
    const DOCX_FILE = 'some_file.docx';
    const mockFileResultPDF = {
      fileURL: PDF_FILE,
    };
    const mockFileResultDOCX = {
      fileURL: DOCX_FILE,
    };
    it('should successfully get pdf of menu', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuID: MENU_ID,
          fileFormat: PDF,
        },
      };
      (mockMenusService.generateFile as jest.MockedFunction<any>).mockResolvedValueOnce(mockFileResultPDF);

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menusController.generateFile(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenusService.generateFile).toHaveBeenCalledTimes(1);
      expect(mockMenusService.generateFile).toHaveBeenCalledWith(PDF, MENU_ID);
      expect(responseObject).toEqual(mockFileResultPDF);
    });
    it('should successfully get docx of menu', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuID: MENU_ID,
          fileFormat: DOCX,
        },
      };
      (mockMenusService.generateFile as jest.MockedFunction<any>).mockResolvedValueOnce(mockFileResultDOCX);

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menusController.generateFile(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenusService.generateFile).toHaveBeenCalledTimes(1);
      expect(mockMenusService.generateFile).toHaveBeenCalledWith(DOCX, MENU_ID);
      expect(responseObject).toEqual(mockFileResultDOCX);
    });
    it('should not get pdf of menu because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menusController.generateFile(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenusService.generateFile).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
