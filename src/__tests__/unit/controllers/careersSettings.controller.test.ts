import { NextFunction, Request, Response } from 'express-serve-static-core';
import CareersSettingsController from '@controllers/careersSettings.controller';
import CareersSettingsService from '@services/careersSettings.service';
import { CareersSettingsModelInterface } from '@interfaces/careersSettings.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/careersSettings.service', () => {
  const mock = {
    getCareersSettings: jest.fn(),
    updateCareersSettings: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new CareersSettingsService({} as CareersSettingsModelInterface, {} as RestaurantsServiceInterface);
const controller = new CareersSettingsController(mockService);

const RESTAURANT_ID = 20;

describe('careersSettingsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getCareersSettings', () => {
    it('should return the response from the service', async () => {
      const settings = {
        isCareersEnabled: true,
        sectionTitle: 'Join us',
        careersText: 'We are hiring.',
        isInquiryFormEnabled: true,
        notificationEmail: 'a@b.com',
      };
      (mockService.getCareersSettings as jest.MockedFunction<any>).mockResolvedValueOnce(settings);
      let body: unknown;
      const mReq = {} as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getCareersSettings(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getCareersSettings).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(body).toEqual(settings);
    });

    it('should call next on service error', async () => {
      (mockService.getCareersSettings as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = {} as Request;
      const mRes: Partial<Response> = { locals: { restaurantID: RESTAURANT_ID } };

      await controller.getCareersSettings(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('updateCareersSettings', () => {
    it('should forward the body to the service', async () => {
      const update = { isCareersEnabled: true, sectionTitle: 'Join us', notificationEmail: 'new@example.com' };
      (mockService.updateCareersSettings as jest.MockedFunction<any>).mockResolvedValueOnce(update);
      let body: unknown;
      const mReq = { body: update } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updateCareersSettings(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updateCareersSettings).toHaveBeenCalledWith(RESTAURANT_ID, update);
      expect(body).toEqual(update);
    });
  });
});
