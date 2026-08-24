import { NextFunction, Request, Response } from 'express-serve-static-core';
import CareerRequestsController from '@controllers/careerRequests.controller';
import CareerRequestsService from '@services/careerRequests.service';
import { CareerRequestsModelInterface, CareerRequestResponseInterface } from '@interfaces/careerRequests.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/careerRequests.service', () => {
  const mock = {
    listCareerRequests: jest.fn(),
    getCareerRequest: jest.fn(),
    updateCareerRequestStatus: jest.fn(),
    deleteCareerRequest: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new CareerRequestsService({} as CareerRequestsModelInterface);
const controller = new CareerRequestsController(mockService);

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;
const SAMPLE: CareerRequestResponseInterface = {
  careerRequestID: REQUEST_ID,
  restaurantID: RESTAURANT_ID,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phoneNumber: '212-555-0100',
  positionAppliedFor: 'Line Cook',
  additionalInformation: null,
  howDidYouHear: null,
  status: 'new',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('careerRequestsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listCareerRequests', () => {
    it('should pass the restaurantID and status filter to the service', async () => {
      (mockService.listCareerRequests as jest.MockedFunction<any>).mockResolvedValueOnce([SAMPLE]);
      const mReq = { query: { status: 'viewed' } } as unknown as Request;
      let body: unknown;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { managerID: 1, isSuper: false, restaurantID: RESTAURANT_ID },
      };

      await controller.listCareerRequests(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.listCareerRequests).toHaveBeenCalledWith(RESTAURANT_ID, { status: 'viewed' });
      expect(body).toEqual([SAMPLE]);
    });

    it('should call next on service error', async () => {
      (mockService.listCareerRequests as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = { query: {} } as unknown as Request;
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.listCareerRequests(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('getCareerRequest', () => {
    it('should fetch a single record by id', async () => {
      (mockService.getCareerRequest as jest.MockedFunction<any>).mockResolvedValueOnce(SAMPLE);
      let body: unknown;
      const mReq = { params: { careerRequestID: '7' } } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getCareerRequest(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getCareerRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(body).toEqual(SAMPLE);
    });
  });

  describe('updateCareerRequestStatus', () => {
    it('should pass the status from the body', async () => {
      (mockService.updateCareerRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce({ ...SAMPLE, status: 'archived' });
      let body: any;
      const mReq = {
        params: { careerRequestID: '7' },
        body: { status: 'archived' },
      } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updateCareerRequestStatus(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updateCareerRequestStatus).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID, 'archived');
      expect(body.status).toEqual('archived');
    });
  });

  describe('deleteCareerRequest', () => {
    it('should respond 204 on successful delete', async () => {
      (mockService.deleteCareerRequest as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      let statusCode = 0;
      const end = jest.fn();
      const mReq = { params: { careerRequestID: '7' } } as unknown as Request;
      const mRes: Partial<Response> = {
        status: jest.fn().mockImplementation((s: number) => {
          statusCode = s;
          return { end } as unknown as Response;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.deleteCareerRequest(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.deleteCareerRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(statusCode).toEqual(204);
      expect(end).toHaveBeenCalled();
    });
  });
});
