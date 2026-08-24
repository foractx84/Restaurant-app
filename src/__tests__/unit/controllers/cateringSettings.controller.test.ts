import { NextFunction, Request, Response } from 'express-serve-static-core';
import CateringSettingsController from '@controllers/cateringSettings.controller';
import CateringSettingsService from '@services/cateringSettings.service';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/cateringSettings.service', () => {
  const mock = {
    getCateringSettings: jest.fn(),
    updateCateringSettings: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new CateringSettingsService({} as RestaurantsServiceInterface);
const controller = new CateringSettingsController(mockService);

const RESTAURANT_ID = 20;

describe('cateringSettingsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getCateringSettings', () => {
    it('should return the response from the service', async () => {
      const settings = { isCateringEnabled: true, cateringNotificationEmail: 'a@b.com' };
      (mockService.getCateringSettings as jest.MockedFunction<any>).mockResolvedValueOnce(settings);
      let body: unknown;
      const mReq = {} as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getCateringSettings(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getCateringSettings).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(body).toEqual(settings);
    });

    it('should call next on service error', async () => {
      (mockService.getCateringSettings as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = {} as Request;
      const mRes: Partial<Response> = { locals: { restaurantID: RESTAURANT_ID } };

      await controller.getCateringSettings(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('updateCateringSettings', () => {
    it('should forward the body to the service', async () => {
      const update = { isCateringEnabled: true, cateringNotificationEmail: 'new@example.com' };
      (mockService.updateCateringSettings as jest.MockedFunction<any>).mockResolvedValueOnce(update);
      let body: unknown;
      const mReq = { body: update } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updateCateringSettings(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updateCateringSettings).toHaveBeenCalledWith(RESTAURANT_ID, update);
      expect(body).toEqual(update);
    });
  });
});
