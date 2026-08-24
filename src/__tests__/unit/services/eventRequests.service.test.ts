import { TapManagerError } from '@exceptions/HttpException';
import EventRequestsService from '@services/eventRequests.service';
import EventRequestsModel from '@/models/eventRequests.model';
import { EventRequestEntity } from '@/entities/eventRequest.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/eventRequests.model', () => {
  const mock = {
    fetchEventRequestsByRestaurantID: jest.fn(),
    fetchEventRequestByID: jest.fn(),
    updateEventRequestStatus: jest.fn(),
    softDeleteEventRequest: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockModel = new EventRequestsModel();
const service = new EventRequestsService(mockModel);

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;

const ENTITY: EventRequestEntity = {
  event_request_id: REQUEST_ID,
  restaurant_id: RESTAURANT_ID,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '212-555-0100',
  type_of_event: 'Birthday Party',
  style_of_event: 'Full catering',
  event_at: '2026-08-15T18:00:00.000Z',
  number_of_people: 30,
  status: 'new',
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
};

describe('eventRequestsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listEventRequests', () => {
    it('should map entities to camelCase response shape', async () => {
      (mockModel.fetchEventRequestsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([ENTITY]);

      const result = await service.listEventRequests(RESTAURANT_ID, {});

      expect(mockModel.fetchEventRequestsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        eventRequestID: REQUEST_ID,
        restaurantID: RESTAURANT_ID,
        firstName: 'Jane',
        lastName: 'Doe',
        styleOfEvent: 'Full catering',
        eventAt: '2026-08-15T18:00:00.000Z',
        status: 'new',
      });
    });

    it('should pass through the status filter', async () => {
      (mockModel.fetchEventRequestsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      await service.listEventRequests(RESTAURANT_ID, { status: 'archived' });

      expect(mockModel.fetchEventRequestsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { status: 'archived' });
    });

    it('should throw HttpException(500) on unknown error', async () => {
      (mockModel.fetchEventRequestsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('boom');
      });

      try {
        await service.listEventRequests(RESTAURANT_ID, {});
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('getEventRequest', () => {
    it('should return the mapped response when row exists', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);

      const result = await service.getEventRequest(REQUEST_ID, RESTAURANT_ID);

      expect(mockModel.fetchEventRequestByID).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
      expect(result.eventRequestID).toEqual(REQUEST_ID);
    });

    it('should throw HttpException(404) when not found', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.getEventRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('updateEventRequestStatus', () => {
    it('should fetch then update and return the new entity', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.updateEventRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...ENTITY,
        status: 'responded',
      });

      const result = await service.updateEventRequestStatus(REQUEST_ID, RESTAURANT_ID, 'responded');

      expect(mockModel.updateEventRequestStatus).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID, 'responded');
      expect(result.status).toEqual('responded');
    });

    it('should 404 if the request does not exist', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateEventRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockModel.updateEventRequestStatus).not.toHaveBeenCalled();
    });

    it('should 404 if the row is concurrently soft-deleted between check and update', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.updateEventRequestStatus as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateEventRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
        fail('expected HttpException(404)');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('deleteEventRequest', () => {
    it('should soft-delete an existing row', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENTITY);
      (mockModel.softDeleteEventRequest as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await service.deleteEventRequest(REQUEST_ID, RESTAURANT_ID);

      expect(mockModel.softDeleteEventRequest).toHaveBeenCalledWith(REQUEST_ID, RESTAURANT_ID);
    });

    it('should 404 if not found', async () => {
      (mockModel.fetchEventRequestByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.deleteEventRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockModel.softDeleteEventRequest).not.toHaveBeenCalled();
    });
  });
});
