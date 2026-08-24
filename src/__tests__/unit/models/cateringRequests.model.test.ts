import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import CateringRequestsModel from '@/models/cateringRequests.model';
import { CateringRequestEntity } from '@/entities/cateringRequest.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, ormConnection: jest.fn() };
});

const cateringRequestsModel = new CateringRequestsModel();

const RESTAURANT_ID = 20;
const REQUEST_ID = 7;
const SAMPLE_ENTITY: CateringRequestEntity = {
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

describe('cateringRequestsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('fetchCateringRequestsByRestaurantID', () => {
    it('should fetch the list of catering requests for a restaurant', async () => {
      const getMany = jest.fn().mockResolvedValueOnce([SAMPLE_ENTITY]);
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany,
      };
      const createQueryBuilder = jest.fn().mockReturnValue(builder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      const result = await cateringRequestsModel.fetchCateringRequestsByRestaurantID(RESTAURANT_ID, {});

      expect(createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([SAMPLE_ENTITY]);
    });

    it('should add a status filter clause when one is provided', async () => {
      const getMany = jest.fn().mockResolvedValueOnce([]);
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany,
      };
      const createQueryBuilder = jest.fn().mockReturnValue(builder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      await cateringRequestsModel.fetchCateringRequestsByRestaurantID(RESTAURANT_ID, { status: 'viewed' });

      expect(builder.andWhere).toHaveBeenCalledWith('catering_request.status = :status', { status: 'viewed' });
    });

    it('should throw an HttpException when a database error occurs', async () => {
      const getMany = jest.fn().mockRejectedValueOnce(new Error('boom'));
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      try {
        await cateringRequestsModel.fetchCateringRequestsByRestaurantID(RESTAURANT_ID, {});
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });

  describe('fetchCateringRequestByID', () => {
    it('should fetch a single catering request by id', async () => {
      const getOne = jest.fn().mockResolvedValueOnce(SAMPLE_ENTITY);
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await cateringRequestsModel.fetchCateringRequestByID(REQUEST_ID, RESTAURANT_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(SAMPLE_ENTITY);
    });

    it('should resolve undefined when no row matches', async () => {
      const getOne = jest.fn().mockResolvedValueOnce(undefined);
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await cateringRequestsModel.fetchCateringRequestByID(REQUEST_ID, RESTAURANT_ID);
      expect(result).toBeUndefined();
    });
  });

  describe('updateCateringRequestStatus', () => {
    const mockUpdateBuilder = (affected: number) => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValueOnce({ affected }),
    });

    const mockSelectBuilder = (entity: CateringRequestEntity | undefined) => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValueOnce(entity),
    });

    it('should update the status, then refetch and return the entity', async () => {
      const updateBuilder = mockUpdateBuilder(1);
      const selectBuilder = mockSelectBuilder({ ...SAMPLE_ENTITY, status: 'viewed' });
      const createQueryBuilder = jest.fn().mockReturnValueOnce(updateBuilder).mockReturnValueOnce(selectBuilder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      const result = await cateringRequestsModel.updateCateringRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');

      expect(updateBuilder.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'viewed' }));
      expect(updateBuilder.andWhere).toHaveBeenCalledWith('deleted_at IS NULL');
      expect(result?.status).toEqual('viewed');
    });

    it('should return undefined when the row was concurrently soft-deleted (affected = 0)', async () => {
      const updateBuilder = mockUpdateBuilder(0);
      const createQueryBuilder = jest.fn().mockReturnValueOnce(updateBuilder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      const result = await cateringRequestsModel.updateCateringRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');

      expect(result).toBeUndefined();
    });

    it('should throw HttpException(500) when the underlying update throws', async () => {
      const updateBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValueOnce(new Error('db down')),
      };
      const createQueryBuilder = jest.fn().mockReturnValueOnce(updateBuilder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      try {
        await cateringRequestsModel.updateCateringRequestStatus(REQUEST_ID, RESTAURANT_ID, 'viewed');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });

  describe('softDeleteCateringRequest', () => {
    it('should set deleted_at on the row', async () => {
      const update = jest.fn().mockResolvedValueOnce(undefined);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ update });

      await cateringRequestsModel.softDeleteCateringRequest(REQUEST_ID, RESTAURANT_ID);

      expect(update).toHaveBeenCalledTimes(1);
      const callArgs = update.mock.calls[0];
      expect(callArgs[1]).toEqual({ catering_request_id: REQUEST_ID, restaurant_id: RESTAURANT_ID });
      expect(callArgs[2]).toHaveProperty('deleted_at');
    });

    it('should throw HttpException(500) on db error', async () => {
      const update = jest.fn().mockRejectedValueOnce(new Error('db down'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ update });

      try {
        await cateringRequestsModel.softDeleteCateringRequest(REQUEST_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });
});
