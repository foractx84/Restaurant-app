import { NextFunction, Request, Response } from 'express-serve-static-core';
import EventRequestsController from '@controllers/eventRequests.controller';
import EventRequestsService from '@services/eventRequests.service';
import { EventRequestResponseInterface, EventRequestsModelInterface } from '@interfaces/eventRequests.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/eventRequests.service', () => {
  const mock = {
    listEventRequests: jest.fn(),
    getEventRequest: jest.fn(),
    updateEventRequestStatus: jest.fn(),
    deleteEventRequest: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new EventRequestsService({} as EventRequestsModelInterface);
const controller = new EventRequestsController(mockService);

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;
const SAMPLE: EventRequestResponseInterface = {
  eventRequestID: REQUEST_ID,
  restaurantID: RESTAURANT_ID,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phoneNumber: '212-555-0100',
  company: null,
  typeOfEvent: 'Birthday Party',
  styleOfEvent: 'Full catering',
  eventAt: '2026-08-15T18:00:00.000Z',
  numberOfPeople: 30,
  additionalInformation: null,
  howDidYouHear: null,
  status: 'new',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('eventRequestsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listEventRequests', () => {
    it('should pass the restaurantID and status filter to the service', async () => {
      (mockService.listEventRequests as jest.MockedFunction<any>).mockResolvedValueOnce([SAMPLE]);
      const mReq = { query: { status: 'viewed' } } as unknown as Request;
      let body: unknown;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { managerID: 1, isSuper: false, restaurantID: RESTAURANT_ID },
      };

      await controller.listEventRequests(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.listEventRequests).toHaveBeenCalledWith(RESTAURANT_ID, { status: 'viewed' });
      expect(body).toEqual([SAMPLE]);
    });

    it('should call next on service error', async () => {
      (mockService.listEventRequests as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = { query: {} } as unknown as Request;
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.listEventRequests(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('getEventRequest', () => {
    it('should fetch a single record by id', async () => {
      (mockService.getEventRequest as jest.MockedFunction<any>).mockResolvedValueOnce(SAMPLE);
      let body: unknown;
      const mReq = { params: { eventRequestID: '7' } } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getEventRequest(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getEventRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(body).toEqual(SAMPLE);
    });
  });

  describe('updateEventRequestStatus', () => {
    it('should pass the status from the body', async () => {
      (mockService.updateEventRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce({ ...SAMPLE, status: 'archived' });
      let body: any;
      const mReq = {
        params: { eventRequestID: '7' },
        body: { status: 'archived' },
      } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updateEventRequestStatus(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updateEventRequestStatus).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID, 'archived');
      expect(body.status).toEqual('archived');
    });
  });

  describe('deleteEventRequest', () => {
    it('should respond 204 on successful delete', async () => {
      (mockService.deleteEventRequest as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      let statusCode = 0;
      const end = jest.fn();
      const mReq = { params: { eventRequestID: '7' } } as unknown as Request;
      const mRes: Partial<Response> = {
        status: jest.fn().mockImplementation((s: number) => {
          statusCode = s;
          return { end } as unknown as Response;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.deleteEventRequest(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.deleteEventRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(statusCode).toEqual(204);
      expect(end).toHaveBeenCalled();
    });
  });
});
