import { NextFunction, Request, Response } from 'express-serve-static-core';
import PageOrderController from '@controllers/pageOrder.controller';
import PageOrderService from '@services/pageOrder.service';
import { PageOrderModelInterface } from '@interfaces/pageOrder.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/pageOrder.service', () => {
  const mock = {
    getPageOrder: jest.fn(),
    updatePageOrder: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new PageOrderService({} as PageOrderModelInterface, {} as RestaurantsServiceInterface);
const controller = new PageOrderController(mockService);

const RESTAURANT_ID = 20;

describe('pageOrderController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getPageOrder', () => {
    it('should return the response from the service', async () => {
      const response = { order: ['menu', 'events'] };
      (mockService.getPageOrder as jest.MockedFunction<any>).mockResolvedValueOnce(response);
      let body: unknown;
      const mReq = {} as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getPageOrder(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getPageOrder).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(body).toEqual(response);
    });

    it('should call next on service error', async () => {
      (mockService.getPageOrder as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = {} as Request;
      const mRes: Partial<Response> = { locals: { restaurantID: RESTAURANT_ID } };

      await controller.getPageOrder(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('updatePageOrder', () => {
    it('should forward the body to the service', async () => {
      const update = { order: ['contact', 'menu'] };
      (mockService.updatePageOrder as jest.MockedFunction<any>).mockResolvedValueOnce(update);
      let body: unknown;
      const mReq = { body: update } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updatePageOrder(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updatePageOrder).toHaveBeenCalledWith(RESTAURANT_ID, update);
      expect(body).toEqual(update);
    });
  });
});
