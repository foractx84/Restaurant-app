import { NextFunction, Request, Response } from 'express-serve-static-core';
import CateringRequestsController from '@controllers/cateringRequests.controller';
import CateringRequestsService from '@services/cateringRequests.service';
import { CateringRequestsModelInterface, CateringRequestResponseInterface } from '@interfaces/cateringRequests.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/cateringRequests.service', () => {
  const mock = {
    listCateringRequests: jest.fn(),
    getCateringRequest: jest.fn(),
    updateCateringRequestStatus: jest.fn(),
    deleteCateringRequest: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockService = new CateringRequestsService({} as CateringRequestsModelInterface);
const controller = new CateringRequestsController(mockService);

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;
const SAMPLE: CateringRequestResponseInterface = {
  cateringRequestID: REQUEST_ID,
  restaurantID: RESTAURANT_ID,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phoneNumber: '212-555-0100',
  streetAddress1: '123 Main St',
  streetAddress2: null,
  city: 'NYC',
  state: 'NY',
  zipCode: '10001',
  company: null,
  numberOfPeople: 50,
  typeOfEvent: 'Wedding',
  eventStartAt: '2026-08-15T18:00:00.000Z',
  eventEndAt: '2026-08-15T22:00:00.000Z',
  styleOfCatering: null,
  specialRequests: 'Vegan',
  additionalInformation: null,
  howDidYouHear: null,
  status: 'new',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('cateringRequestsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listCateringRequests', () => {
    it('should pass the restaurantID and status filter to the service', async () => {
      (mockService.listCateringRequests as jest.MockedFunction<any>).mockResolvedValueOnce([SAMPLE]);
      const mReq = { query: { status: 'viewed' } } as unknown as Request;
      let body: unknown;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { managerID: 1, isSuper: false, restaurantID: RESTAURANT_ID },
      };

      await controller.listCateringRequests(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.listCateringRequests).toHaveBeenCalledWith(RESTAURANT_ID, { status: 'viewed' });
      expect(body).toEqual([SAMPLE]);
    });

    it('should call next on service error', async () => {
      (mockService.listCateringRequests as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });
      const mNext = jest.fn();
      const mReq = { query: {} } as unknown as Request;
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.listCateringRequests(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('getCateringRequest', () => {
    it('should fetch a single record by id', async () => {
      (mockService.getCateringRequest as jest.MockedFunction<any>).mockResolvedValueOnce(SAMPLE);
      let body: unknown;
      const mReq = { params: { cateringRequestID: '7' } } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.getCateringRequest(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.getCateringRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(body).toEqual(SAMPLE);
    });
  });

  describe('updateCateringRequestStatus', () => {
    it('should pass the status from the body', async () => {
      (mockService.updateCateringRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce({ ...SAMPLE, status: 'archived' });
      let body: any;
      const mReq = {
        params: { cateringRequestID: '7' },
        body: { status: 'archived' },
      } as unknown as Request;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(r => (body = r)),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.updateCateringRequestStatus(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.updateCateringRequestStatus).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID, 'archived');
      expect(body.status).toEqual('archived');
    });
  });

  describe('deleteCateringRequest', () => {
    it('should respond 204 on successful delete', async () => {
      (mockService.deleteCateringRequest as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      let statusCode = 0;
      const end = jest.fn();
      const mReq = { params: { cateringRequestID: '7' } } as unknown as Request;
      const mRes: Partial<Response> = {
        status: jest.fn().mockImplementation((s: number) => {
          statusCode = s;
          return { end } as unknown as Response;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await controller.deleteCateringRequest(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockService.deleteCateringRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(statusCode).toEqual(204);
      expect(end).toHaveBeenCalled();
    });
  });
});
