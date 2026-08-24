import { ormConnection, rawQuery } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import RestaurantAddressModel from '@/models/restaurantAddress.model';

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
  return {
    __esModule: true,
    rawQuery: jest.fn(),
    ormConnection: jest.fn(),
  };
});

const restaurantAddressModel = new RestaurantAddressModel();

describe('restaurantAddressModel', () => {
  afterEach(() => {
    (rawQuery as jest.MockedFunction<any>).mockReset();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const mockRestaurantAddress = {
    restaurant_id: 1001,
    address1: '123 fake street',
    city: 'New York',
    governing_district: 'NY',
    country_id: 1,
    postal_code: '12345',
    lat: 17.87508182685489,
    long: -17.48914886925735,
    timezone: 'America/New_York',
  };
  describe('fetchRestaurantAddressByRestaurantID', () => {
    it('should fetch restaurant address entity by restaurant id successfully', async () => {
      const expectedResponse = {
        restaurant_address_id: 5,
        restaurant_id: 1001,
        address1: '123 fake street',
        address2: null,
        street_number: null,
        street_name: null,
        city: 'New York',
        governing_district: 'NY',
        country_id: 1,
        postal_code: '12345',
        lat: '17.875082',
        long: '-17.489149',
        coordinates: '0101000020E6',
        timezone: 'America/New_York',
        created_at: '2022-08-05T00:15:19.255Z',
        updated_at: '2022-08-05T00:15:19.255Z',
      };

      const findOne = jest.fn().mockResolvedValue(expectedResponse);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      const result = await restaurantAddressModel.fetchRestaurantAddressByRestaurantID(1);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while fetching restaurant address entity', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await restaurantAddressModel.fetchRestaurantAddressByRestaurantID(1);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(findOne).toHaveBeenCalledTimes(1);
    });
  });
  describe('fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID', () => {
    it('should fetch restaurant address entity by restaurant address id and restaurant id successfully', async () => {
      const expectedResponse = {
        restaurant_address_id: 5,
        restaurant_id: 1001,
        address1: '123 fake street',
        address2: null,
        street_number: null,
        street_name: null,
        city: 'New York',
        governing_district: 'NY',
        country_id: 1,
        postal_code: '12345',
        lat: '17.875082',
        long: '-17.489149',
        coordinates: '0101000020E6',
        timezone: 'America/New_York',
        created_at: '2022-08-05T00:15:19.255Z',
        updated_at: '2022-08-05T00:15:19.255Z',
      };

      const findOne = jest.fn().mockResolvedValue(expectedResponse);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      const result = await restaurantAddressModel.fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID(1, 5);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while fetching restaurant address entity by restaurant id and restaurant address id', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await restaurantAddressModel.fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID(1, 5);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(findOne).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertRestaurantAddressEntity', () => {
    it('should insert restaurant address entity successfully', async () => {
      const expectedResponse = {
        restaurant_address_id: 5,
        restaurant_id: 1001,
        address1: '123 fake street',
        address2: null,
        street_number: null,
        street_name: null,
        city: 'New York',
        governing_district: 'NY',
        country_id: 1,
        postal_code: '12345',
        lat: '17.875082',
        long: '-17.489149',
        coordinates: '0101000020E6',
        timezone: 'America/New_York',
        created_at: '2022-08-05T00:15:19.255Z',
        updated_at: '2022-08-05T00:15:19.255Z',
      };

      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await restaurantAddressModel.insertRestaurantAddressEntity(mockRestaurantAddress as unknown as RestaurantAddressEntity);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting restaurant address entity', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await restaurantAddressModel.insertRestaurantAddressEntity(mockRestaurantAddress as unknown as RestaurantAddressEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateRestaurantAddressEntity', () => {
    const ADDRESS_ID = 123;
    it('should update restaurant address entity successfully', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await restaurantAddressModel.updateRestaurantAddressEntity(mockRestaurantAddress as unknown as RestaurantAddressEntity, ADDRESS_ID);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating restaurant address entity', async () => {
      const update = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await restaurantAddressModel.updateRestaurantAddressEntity(mockRestaurantAddress as unknown as RestaurantAddressEntity, ADDRESS_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(update).toHaveBeenCalledTimes(1);
    });
  });
});
