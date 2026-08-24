import { NextFunction, Request, Response } from 'express-serve-static-core';
import EventSettingsController from '@controllers/eventSettings.controller';
import EventSettingsService from '@services/eventSettings.service';
import { EventSettingsModelInterface } from '@interfaces/eventSettings.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/eventSettings.service', () => {
  const mock = {
    getEventSettings: jest.fn(),
    updateEventSettings: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new EventSettingsService({} as EventSettingsModelInterface, {} as RestaurantsServiceInterface);
const controller = new EventSettingsController(mockService);

const RESTAURANT_ID = 20;

const SAMPLE_SETTINGS = {
  isEventsEnabled: true,
  sectionTitle: "Bob's Crab Shack",
  eventsText: 'Host your next event with us.',
  deckUrl: 'https://example.com/deck.pdf',
  isInquiryFormEnabled: true,
  notificationEmail: 'events@example.com',
};

describe('eventSettingsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getEventSettings', () => {
    it('should return the response from the service', async () => {
      (mockService.getEventSettings as jest.MockedFunction<any>).mockResolvedValueOnce(SAMPLE_SETTINGS);
      let body: unknown;
      const mReq = {} as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getEventSettings(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getEventSettings).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(body).toEqual(SAMPLE_SETTINGS);
    });

    it('should call next on service error', async () => {
      (mockService.getEventSettings as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = {} as Request;
      const mRes: Partial<Response> = { locals: { restaurantID: RESTAURANT_ID } };

      await controller.getEventSettings(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('updateEventSettings', () => {
    it('should forward the body to the service', async () => {
      const update = { isEventsEnabled: true, sectionTitle: 'New title' };
      (mockService.updateEventSettings as jest.MockedFunction<any>).mockResolvedValueOnce({ ...SAMPLE_SETTINGS, ...update });
      let body: unknown;
      const mReq = { body: update } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updateEventSettings(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updateEventSettings).toHaveBeenCalledWith(RESTAURANT_ID, update);
      expect(body).toMatchObject(update);
    });
  });
});
