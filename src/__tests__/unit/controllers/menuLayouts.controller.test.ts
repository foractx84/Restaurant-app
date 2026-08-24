import MenuLayoutsController from '@/controllers/menuLayouts.controller';
import MenuLayoutsModel from '@/models/menuLayouts.model';
import MenuLayoutsService from '@/services/menuLayouts.service';
import { NextFunction, Request, Response } from 'express-serve-static-core';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/menuLayouts.service', () => {
  const mockMenuLayoutService = {
    getAllMenuLayouts: jest.fn(),
    updateRestaurantMenuLayout: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuLayoutService) };
});

const mockMenuLayoutService = new MenuLayoutsService(new MenuLayoutsModel());
const menuLayoutsController = new MenuLayoutsController(mockMenuLayoutService);

describe('menuLayoutsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('updateRestaurantMenuLayout', () => {
    it('should successfully update menu layout of a restaurant', async () => {
      (mockMenuLayoutService.updateRestaurantMenuLayout as jest.MockedFunction<any>).mockResolvedValueOnce({});

      // mock a request needed by controller
      const mReq = {
        body: {
          layoutID: 1,
        },
      };

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuLayoutsController.updateRestaurantMenuLayout(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuLayoutService.updateRestaurantMenuLayout).toHaveBeenCalledTimes(1);
    });
    it('should not update menu layout of a restaurant because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuLayoutsController.updateRestaurantMenuLayout(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getAllMenuLayouts', () => {
    it('should successfully get all menu layouts of a restaurant', async () => {
      (mockMenuLayoutService.getAllMenuLayouts as jest.MockedFunction<any>).mockResolvedValueOnce({});

      // mock a request needed by controller
      const mReq = {};

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuLayoutsController.getAllMenuLayouts(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuLayoutService.getAllMenuLayouts).toHaveBeenCalledTimes(1);
    });
    it('should not get all menu layouts because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuLayoutsController.getAllMenuLayouts(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
});
