import { TapManagerError } from '@exceptions/HttpException';
import CateringRequestsService from '@services/cateringRequests.service';
import CateringRequestsModel from '@/models/cateringRequests.model';
import { CateringRequestEntity } from '@/entities/cateringRequest.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/cateringRequests.model', () => {
  const mock = {
    fetchCateringRequestsByRestaurantID: jest.fn(),
    fetchCateringRequestByID: jest.fn(),
    updateCateringRequestStatus: jest.fn(),
    softDeleteCateringRequest: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockModel = new CateringRequestsModel();
const service = new CateringRequestsService(mockModel);

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;

const ENTITY: CateringRequestEntity = {
  catering_request_id: REQUEST_ID,
  restaurant_id: RESTAURANT_ID,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '212-555-0100',
  street_address_1: '123 Main St',
  city: 'NYC',
  state: 'NY',
  zip_code: '10001',
  number_of_people: 50,
  type_of_event: 'Wedding',
  event_start_at: '2026-08-15T18:00:00.000Z',
  event_end_at: '2026-08-15T22:00:00.000Z',
  special_requests: 'Vegan',
  status: 'new',
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
};

describe('cateringRequestsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listCateringRequests', () => {
    it('should map entities to camelCase response shape', async () => {
      (mockModel.fetchCateringRequestsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([ENTITY]);

      const result = await service.listCateringRequests(RESTAURANT_ID, {});

      expect(mockModel.fetchCateringRequestsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        cateringRequestID: REQUEST_ID,
        restaurantID: RESTAURANT_ID,
        firstName: 'Jane',
        lastName: 'Doe',
        eventStartAt: '2026-08-15T18:00:00.000Z',
        status: 'new',
      });
    });

    it('should pass through the status filter', async () => {
      (mockModel.fetchCateringRequestsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      await service.listCateringRequests(RESTAURANT_ID, { status: 'archived' });

      expect(mockModel.fetchCateringRequestsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { status: 'archived' });
    });

    it('should throw HttpException(500) on unknown error', async () => {
      (mockModel.fetchCateringRequestsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });

      try {
        await service.listCateringRequests(RESTAURANT_ID, {});
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('getCateringRequest', () => {
    it('should return the mapped response when row exists', async () => {
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);

      const result = await service.getCateringRequest(REQUEST_ID, RESTAURANT_ID);

      expect(mockModel.fetchCateringRequestByID).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(result.cateringRequestID).toEqual(REQUEST_ID);
    });

    it('should throw HttpException(404) when not found', async () => {
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.getCateringRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('updateCateringRequestStatus', () => {
    it('should fetch then update and return the new entity', async () => {
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.updateCateringRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...ENTITY,
        status: 'responded',
      });

      const result = await service.updateCateringRequestStatus(REQUEST_ID, RESTAURANT_ID, 'responded');

      expect(mockModel.updateCateringRequestStatus).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID, 'responded');
      expect(result.status).toEqual('responded');
    });

    it('should 404 if the request does not exist', async () => {
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateCateringRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockModel.updateCateringRequestStatus).not.toHaveBeenCalled();
    });

    it('should 404 if the row is concurrently soft-deleted between check and update', async () => {
      // Service finds the row...
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      // ...but the model's update returns undefined (affected = 0).
      (mockModel.updateCateringRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateCateringRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
        fail('expected HttpException(404)');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('deleteCateringRequest', () => {
    it('should soft-delete an existing row', async () => {
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.softDeleteCateringRequest as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await service.deleteCateringRequest(REQUEST_ID, RESTAURANT_ID);

      expect(mockModel.softDeleteCateringRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
    });

    it('should 404 if not found', async () => {
      (mockModel.fetchCateringRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.deleteCateringRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockModel.softDeleteCateringRequest).not.toHaveBeenCalled();
    });
  });
});
