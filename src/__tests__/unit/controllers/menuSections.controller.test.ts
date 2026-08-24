import MenuSectionsController from '@/controllers/menuSections.controller';
import { CreateMenuSectionsInterface, MenuSectionsModelInterface } from '@/interfaces/menuSections.interface';
import MenuSectionsService from '@/services/menuSections.service';
import { Request, Response, NextFunction } from 'express';
import SoftDeleteService from '@/services/softDelete.service';
import SoftDeleteModel from '@/models/softDelete.model';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/menuSections.service', () => {
  const mockMenuSectionsService = {
    insertMenuSections: jest.fn(),
    createMenuSections: jest.fn(),
    deleteMenuSection: jest.fn(),
    editMenuSection: jest.fn(),
    hideMenuSection: jest.fn(),
    reorderMenuSections: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuSectionsService) };
});
// mock the soft delete service
jest.mock('@/services/softDelete.service', () => {
  const mockSoftDeleteService = {
    softDeleteMenuSectionByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSoftDeleteService) };
});
// mock menus service object
const mockMenuSectionsService = new MenuSectionsService({} as MenuSectionsModelInterface);
const mockSoftDeleteService = new SoftDeleteService(new SoftDeleteModel());

// create test controller object
const menuSectionsController = new MenuSectionsController(mockMenuSectionsService, mockSoftDeleteService);

// unit testing
describe('menuSectionsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createMenuSections', () => {
    it('should successfully create menu sections', async () => {
      // mock the required response for the test
      const mockMenuSectionResponse: CreateMenuSectionsInterface = {
        menuID: 275,
        menuSections: [
          {
            menuSectionID: 1104,
            name: 'menu section 1',
            menuID: 275,
            createdAt: '2022-02-15T01:14:31.847Z',
            updatedAt: '2022-02-15T01:14:31.847Z',
            listOrder: 0,
            message: 'test message',
          },
          {
            menuSectionID: 1105,
            name: 'menu section 2',
            menuID: 275,
            createdAt: '2022-02-15T01:14:31.847Z',
            updatedAt: '2022-02-15T01:14:31.847Z',
            listOrder: 1,
          },
        ],
      };
      // set up mock menus service to return our mock response to controller
      (mockMenuSectionsService.createMenuSections as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSectionResponse);
      // mock a request needed by controller
      const mReq = {
        body: {
          menuID: 275,
          menuSections: [
            {
              name: 'menu section 1',
              message: 'test message',
            },
            {
              name: 'menu section 2',
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
      await menuSectionsController.createMenuSections(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuSectionsService.createMenuSections).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockMenuSectionResponse);
    });
    it('should not create menu section because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuSectionsController.createMenuSections(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuSectionsService.createMenuSections).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteMenuSection', () => {
    it('should successfully soft delete menu section', async () => {
      const mReq: Partial<Request> = {
        params: {
          menuSectionID: '28',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(() => {
          'Success!';
        }),
        locals: { restaurantID: 1 },
      };
      const mNext = jest.fn();

      await menuSectionsController.deleteMenuSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockSoftDeleteService.softDeleteMenuSectionByID).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu section because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuSectionsController.deleteMenuSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockSoftDeleteService.softDeleteMenuSectionByID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('reorderMenuSections', () => {
    it('should successfully reorder menu sections', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuID: '275',
          menuSectionsOrder: [3, 1, 2],
        },
      };
      (mockMenuSectionsService.reorderMenuSections as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menuSectionsController.reorderMenuSections(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuSectionsService.reorderMenuSections).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not reorder menu sections because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuSectionsController.reorderMenuSections(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuSectionsService.reorderMenuSections).not.toHaveBeenCalled();
    });
  });
  describe('editMenuSection', () => {
    it('should successfully edit menu section', async () => {
      // mock the required response for the test
      // set up mock menus service to return our mock response to controller
      (mockMenuSectionsService.editMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      // mock a request needed by controller

      const mReq = {
        body: {
          menuID: 275,
          menuSectionID: 1,
          menuSectionName: 'Test Name',
        },
      };

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      // call on controller as the router would
      await menuSectionsController.editMenuSection(mReq as Request, mRes as Response, mNext as NextFunction);
      // enforce test expectations
      expect(mockMenuSectionsService.editMenuSection).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not edit menu section because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuSectionsController.editMenuSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuSectionsService.editMenuSection).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('hideMenuSection', () => {
    it('should successfully hide menu section', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuSectionID: 345,
          hide: true,
        },
      };
      (mockMenuSectionsService.hideMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menuSectionsController.hideMenuSection(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuSectionsService.hideMenuSection).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not hide menu section because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuSectionsController.hideMenuSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuSectionsService.hideMenuSection).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
