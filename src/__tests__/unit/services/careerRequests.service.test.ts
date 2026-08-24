import { TapManagerError } from '@exceptions/HttpException';
import CareerRequestsService from '@services/careerRequests.service';
import CareerRequestsModel from '@/models/careerRequests.model';
import { CareerRequestEntity } from '@/entities/careerRequest.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/careerRequests.model', () => {
  const mock = {
    fetchCareerRequestsByRestaurantID: jest.fn(),
    fetchCareerRequestByID: jest.fn(),
    updateCareerRequestStatus: jest.fn(),
    softDeleteCareerRequest: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockModel = new CareerRequestsModel();
const service = new CareerRequestsService(mockModel);

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;

const ENTITY: CareerRequestEntity = {
  career_request_id: REQUEST_ID,
  restaurant_id: RESTAURANT_ID,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '212-555-0100',
  position_applied_for: 'Line Cook',
  status: 'new',
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
};

describe('careerRequestsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listCareerRequests', () => {
    it('should map entities to camelCase response shape', async () => {
      (mockModel.fetchCareerRequestsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([ENTITY]);

      const result = await service.listCareerRequests(RESTAURANT_ID, {});

      expect(mockModel.fetchCareerRequestsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        careerRequestID: REQUEST_ID,
        restaurantID: RESTAURANT_ID,
        firstName: 'Jane',
        lastName: 'Doe',
        positionAppliedFor: 'Line Cook',
        status: 'new',
      });
    });

    it('should pass through the status filter', async () => {
      (mockModel.fetchCareerRequestsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      await service.listCareerRequests(RESTAURANT_ID, { status: 'archived' });

      expect(mockModel.fetchCareerRequestsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { status: 'archived' });
    });

    it('should throw HttpException(500) on unknown error', async () => {
      (mockModel.fetchCareerRequestsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });

      try {
        await service.listCareerRequests(RESTAURANT_ID, {});
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('getCareerRequest', () => {
    it('should return the mapped response when row exists', async () => {
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);

      const result = await service.getCareerRequest(REQUEST_ID, RESTAURANT_ID);

      expect(mockModel.fetchCareerRequestByID).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(result.careerRequestID).toEqual(REQUEST_ID);
    });

    it('should throw HttpException(404) when not found', async () => {
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.getCareerRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('updateCareerRequestStatus', () => {
    it('should fetch then update and return the new entity', async () => {
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.updateCareerRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...ENTITY,
        status: 'responded',
      });

      const result = await service.updateCareerRequestStatus(REQUEST_ID, RESTAURANT_ID, 'responded');

      expect(mockModel.updateCareerRequestStatus).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID, 'responded');
      expect(result.status).toEqual('responded');
    });

    it('should 404 if the request does not exist', async () => {
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateCareerRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockModel.updateCareerRequestStatus).not.toHaveBeenCalled();
    });

    it('should 404 if the row is concurrently soft-deleted between check and update', async () => {
      // Service finds the row...
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      // ...but the model's update returns undefined (affected = 0).
      (mockModel.updateCareerRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateCareerRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
        fail('expected HttpException(404)');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('deleteCareerRequest', () => {
    it('should soft-delete an existing row', async () => {
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.softDeleteCareerRequest as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await service.deleteCareerRequest(REQUEST_ID, RESTAURANT_ID);

      expect(mockModel.softDeleteCareerRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
    });

    it('should 404 if not found', async () => {
      (mockModel.fetchCareerRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.deleteCareerRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockModel.softDeleteCareerRequest).not.toHaveBeenCalled();
    });
  });
});
