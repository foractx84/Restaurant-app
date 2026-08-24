import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import RestaurantAddressModel from '@/models/restaurantAddress.model';
import RestaurantAddressService from '@/services/restaurantAddress.service';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { EntityManager } from 'typeorm';
import { CreateRestaurantAddressRequestInterface, EditRestaurantAddressRequestInterface } from '@interfaces/restaurantAddress.interface';
import { getLatLongGeocoderFromAddress } from '@utils/geocoder';

jest.mock('@/utils/geocoder', () => {
  return { __esModule: true, getLatLongGeocoderFromAddress: jest.fn() };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/restaurantAddress.model', () => {
  const mockRestaurantAddressModel = {
    fetchRestaurantAddressByRestaurantID: jest.fn(),
    insertRestaurantAddressEntity: jest.fn(),
    updateRestaurantAddressEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantAddressModel) };
});

const mockRestaurantAddressModel = new RestaurantAddressModel();
const restaurantAddressService = new RestaurantAddressService(mockRestaurantAddressModel);

describe('restaurantAddressService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const US_COUNTRY_ENTITY = {
    country_id: 1,
    name: 'United States',
    abbreviation: 'US',
    currency_code: 'USD',
  };
  const FR_COUNTRY_ENTITY = {
    country_id: 2,
    name: 'France',
    abbreviation: 'FR',
    currency_code: 'EUR',
  };
  const LAT_LONG = [17.12345, -17.12345];
  const RESTAURANT_ID = 1;
  describe('createRestaurantAddress', () => {
    const mockModelResponse: RestaurantAddressEntity[] = [
      {
        restaurant_address_id: 1,
        country_id: 1,
        restaurant_id: 1,
        address1: '123 fake street',
        address2: '',
        street_name: '',
        street_number: '',
        city: 'New York City',
        governing_district: 'New York',
        postal_code: '12345',
        timezone: 'America/New_York',
        coordinates: 201010101010,
        lat: 17.12345,
        long: -17.12345,
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2022-01-01T00:00:00Z',
      },
    ];
    const expectedResponse = [
      {
        address1: '123 fake street',
        address2: '',
        city: 'New York City',
        coordinates: 201010101010,
        country_id: 1,
        created_at: '2022-01-01T00:00:00Z',
        governing_district: 'New York',
        lat: 17.12345,
        long: -17.12345,
        postal_code: '12345',
        restaurant_address_id: 1,
        restaurant_id: 1,
        street_name: '',
        street_number: '',
        timezone: 'America/New_York',
        updated_at: '2022-01-01T00:00:00Z',
      },
    ];
    const COORDINATES_ADDRESS_REQUEST = {
      address1: '123 fake street',
      city: 'New York City',
      governingDistrict: 'NY',
      country: 'United States',
      postalCode: '12345',
      timezone: 'America/New_York',
      coordinates: {
        lat: 17.12345,
        long: -17.12345,
      },
    } as CreateRestaurantAddressRequestInterface;
    const ADDRESS_REQUEST = {
      address1: '123 fake street',
      city: 'New York City',
      governingDistrict: 'NY',
      country: 'United States',
      postalCode: '12345',
      timezone: 'America/New_York',
    } as CreateRestaurantAddressRequestInterface;
    it('should successfully create restaurant address with lat/long provided in request', async () => {
      (mockRestaurantAddressModel.insertRestaurantAddressEntity as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      const result = await restaurantAddressService.createRestaurantAddress(
        COORDINATES_ADDRESS_REQUEST,
        US_COUNTRY_ENTITY,
        RESTAURANT_ID,
        {} as EntityManager,
      );

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();
      expect(mockRestaurantAddressModel.insertRestaurantAddressEntity).toHaveBeenCalledWith(
        {
          restaurant_id: RESTAURANT_ID,
          address1: COORDINATES_ADDRESS_REQUEST.address1,
          address2: null,
          street_number: null,
          street_name: null,
          city: COORDINATES_ADDRESS_REQUEST.city,
          governing_district: COORDINATES_ADDRESS_REQUEST.governingDistrict,
          country_id: US_COUNTRY_ENTITY.country_id,
          postal_code: COORDINATES_ADDRESS_REQUEST.postalCode,
          lat: COORDINATES_ADDRESS_REQUEST.coordinates.lat,
          long: COORDINATES_ADDRESS_REQUEST.coordinates.long,
          timezone: COORDINATES_ADDRESS_REQUEST.timezone,
        },
        {}, // Empty object is repository being passed to model
      );
      expect(result).toEqual(expectedResponse);
    });
    it('should successfully create restaurant address without lat/long provided in request for restaurant in United States', async () => {
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce(LAT_LONG);
      (mockRestaurantAddressModel.insertRestaurantAddressEntity as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await restaurantAddressService.createRestaurantAddress(ADDRESS_REQUEST, US_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);

      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(
        `${ADDRESS_REQUEST.address1}, ${ADDRESS_REQUEST.city}, ${ADDRESS_REQUEST.governingDistrict}, ${ADDRESS_REQUEST.postalCode}`,
        RESTAURANT_ID,
      );
      expect(mockRestaurantAddressModel.insertRestaurantAddressEntity).toHaveBeenCalledWith(
        {
          restaurant_id: RESTAURANT_ID,
          address1: ADDRESS_REQUEST.address1,
          address2: null,
          street_number: null,
          street_name: null,
          city: ADDRESS_REQUEST.city,
          governing_district: ADDRESS_REQUEST.governingDistrict,
          country_id: US_COUNTRY_ENTITY.country_id,
          postal_code: ADDRESS_REQUEST.postalCode,
          lat: LAT_LONG[0],
          long: LAT_LONG[1],
          timezone: ADDRESS_REQUEST.timezone,
        },
        {}, // Empty object is repository being passed to model
      );
      expect(result).toEqual(expectedResponse);
    });
    it('should NOT successfully create restaurant address without lat/long provided in request for restaurant in United States when error occurs while geocoding', async () => {
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce([undefined, undefined]);
      (mockRestaurantAddressModel.insertRestaurantAddressEntity as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      try {
        await restaurantAddressService.createRestaurantAddress(ADDRESS_REQUEST, US_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(422);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(
        `${ADDRESS_REQUEST.address1}, ${ADDRESS_REQUEST.city}, ${ADDRESS_REQUEST.governingDistrict}, ${ADDRESS_REQUEST.postalCode}`,
        RESTAURANT_ID,
      );
      expect(mockRestaurantAddressModel.insertRestaurantAddressEntity).not.toHaveBeenCalled();
    });
    it('should successfully create restaurant address without lat/long provided in request for restaurant outside of United States', async () => {
      (mockRestaurantAddressModel.insertRestaurantAddressEntity as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await restaurantAddressService.createRestaurantAddress(ADDRESS_REQUEST, FR_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();
      expect(mockRestaurantAddressModel.insertRestaurantAddressEntity).toHaveBeenCalledWith(
        {
          restaurant_id: RESTAURANT_ID,
          address1: ADDRESS_REQUEST.address1,
          address2: null,
          street_number: null,
          street_name: null,
          city: ADDRESS_REQUEST.city,
          governing_district: ADDRESS_REQUEST.governingDistrict,
          country_id: FR_COUNTRY_ENTITY.country_id,
          postal_code: ADDRESS_REQUEST.postalCode,
          lat: null,
          long: null,
          timezone: ADDRESS_REQUEST.timezone,
        },
        {}, // Empty object is repository being passed to model
      );
      expect(result).toEqual(expectedResponse);
    });
    it('should throw HttpException if HttpException error occurs while inserting restaurant address', async () => {
      (mockRestaurantAddressModel.insertRestaurantAddressEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await restaurantAddressService.createRestaurantAddress(ADDRESS_REQUEST, FR_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantAddressModel.insertRestaurantAddressEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists while inserting restaurant address', async () => {
      (mockRestaurantAddressModel.insertRestaurantAddressEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantAddressService.createRestaurantAddress(ADDRESS_REQUEST, FR_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantAddressModel.insertRestaurantAddressEntity).toHaveBeenCalledTimes(1);
    });
  });
  describe('getRestaurantAddressByRestaurantID', () => {
    const mockModelResponse: RestaurantAddressEntity[] = [
      {
        restaurant_address_id: 1,
        country_id: 1,
        restaurant_id: 1,
        address1: '123 fake street',
        address2: '',
        street_name: '',
        street_number: '',
        city: 'New York City',
        governing_district: 'New York',
        postal_code: '12345',
        timezone: 'America/New_York',
        coordinates: 201010101010,
        lat: 17.12345,
        long: -17.12345,
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2022-01-01T00:00:00Z',
      },
    ];
    const expectedResponse = [
      {
        address1: '123 fake street',
        address2: '',
        city: 'New York City',
        coordinates: 201010101010,
        country_id: 1,
        created_at: '2022-01-01T00:00:00Z',
        governing_district: 'New York',
        lat: 17.12345,
        long: -17.12345,
        postal_code: '12345',
        restaurant_address_id: 1,
        restaurant_id: 1,
        street_name: '',
        street_number: '',
        timezone: 'America/New_York',
        updated_at: '2022-01-01T00:00:00Z',
      },
    ];
    const RESTAURANT_ID = 1;
    it('should successfully get restaurant address by restaurant id', async () => {
      (mockRestaurantAddressModel.fetchRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      const result = await restaurantAddressService.getRestaurantAddressByRestaurantID(RESTAURANT_ID);

      expect(mockRestaurantAddressModel.fetchRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw HttpException if HttpException error occurs while getting restaurant address by restaurant id', async () => {
      (mockRestaurantAddressModel.fetchRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await restaurantAddressService.getRestaurantAddressByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantAddressModel.fetchRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists while getting restaurant address by restaurant id', async () => {
      (mockRestaurantAddressModel.fetchRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantAddressService.getRestaurantAddressByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantAddressModel.fetchRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateRestaurantAddress', () => {
    const RESTAURANT_ID = 1;
    const ADDRESS_ID = 123;
    const COORDINATES_ADDRESS_REQUEST = {
      restaurantAddressID: ADDRESS_ID,
      address1: '123 fake street',
      city: 'New York City',
      governingDistrict: 'NY',
      country: 'United States',
      postalCode: '12345',
      timezone: 'America/New_York',
      coordinates: {
        lat: 17.12345,
        long: -17.12345,
      },
    } as EditRestaurantAddressRequestInterface;
    const ADDRESS_REQUEST = {
      restaurantAddressID: ADDRESS_ID,
      address1: '123 fake street',
      city: 'New York City',
      governingDistrict: 'NY',
      country: 'United States',
      postalCode: '12345',
      timezone: 'America/New_York',
    } as EditRestaurantAddressRequestInterface;
    it('should successfully update restaurant address with lat/long provided in request', async () => {
      await restaurantAddressService.updateRestaurantAddress(COORDINATES_ADDRESS_REQUEST, US_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();
      expect(mockRestaurantAddressModel.updateRestaurantAddressEntity).toHaveBeenCalledWith(
        {
          restaurant_id: RESTAURANT_ID,
          address1: COORDINATES_ADDRESS_REQUEST.address1,
          address2: null,
          street_number: null,
          street_name: null,
          city: COORDINATES_ADDRESS_REQUEST.city,
          governing_district: COORDINATES_ADDRESS_REQUEST.governingDistrict,
          country_id: US_COUNTRY_ENTITY.country_id,
          postal_code: COORDINATES_ADDRESS_REQUEST.postalCode,
          lat: COORDINATES_ADDRESS_REQUEST.coordinates.lat,
          long: COORDINATES_ADDRESS_REQUEST.coordinates.long,
          timezone: COORDINATES_ADDRESS_REQUEST.timezone,
        },
        ADDRESS_ID,
        {}, // Empty object is repository being passed to model
      );
    });
    it('should successfully update restaurant address without lat/long provided in request for restaurant in United States', async () => {
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce(LAT_LONG);

      await restaurantAddressService.updateRestaurantAddress(ADDRESS_REQUEST, US_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);

      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(
        `${ADDRESS_REQUEST.address1}, ${ADDRESS_REQUEST.city}, ${ADDRESS_REQUEST.governingDistrict}, ${ADDRESS_REQUEST.postalCode}`,
        RESTAURANT_ID,
      );
      expect(mockRestaurantAddressModel.updateRestaurantAddressEntity).toHaveBeenCalledWith(
        {
          restaurant_id: RESTAURANT_ID,
          address1: ADDRESS_REQUEST.address1,
          address2: null,
          street_number: null,
          street_name: null,
          city: ADDRESS_REQUEST.city,
          governing_district: ADDRESS_REQUEST.governingDistrict,
          country_id: US_COUNTRY_ENTITY.country_id,
          postal_code: ADDRESS_REQUEST.postalCode,
          lat: LAT_LONG[0],
          long: LAT_LONG[1],
          timezone: ADDRESS_REQUEST.timezone,
        },
        ADDRESS_ID,
        {}, // Empty object is repository being passed to model
      );
    });
    it('should NOT successfully update restaurant address without lat/long provided in request for restaurant in United States when error occurs while geocoding', async () => {
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce([undefined, undefined]);

      try {
        await restaurantAddressService.updateRestaurantAddress(ADDRESS_REQUEST, US_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(422);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(
        `${ADDRESS_REQUEST.address1}, ${ADDRESS_REQUEST.city}, ${ADDRESS_REQUEST.governingDistrict}, ${ADDRESS_REQUEST.postalCode}`,
        RESTAURANT_ID,
      );
      expect(mockRestaurantAddressModel.updateRestaurantAddressEntity).not.toHaveBeenCalled();
    });
    it('should successfully update restaurant address without lat/long provided in request for restaurant outside of United States', async () => {
      await restaurantAddressService.updateRestaurantAddress(ADDRESS_REQUEST, FR_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();
      expect(mockRestaurantAddressModel.updateRestaurantAddressEntity).toHaveBeenCalledWith(
        {
          restaurant_id: RESTAURANT_ID,
          address1: ADDRESS_REQUEST.address1,
          address2: null,
          street_number: null,
          street_name: null,
          city: ADDRESS_REQUEST.city,
          governing_district: ADDRESS_REQUEST.governingDistrict,
          country_id: FR_COUNTRY_ENTITY.country_id,
          postal_code: ADDRESS_REQUEST.postalCode,
          lat: null,
          long: null,
          timezone: ADDRESS_REQUEST.timezone,
        },
        ADDRESS_ID,
        {}, // Empty object is repository being passed to model
      );
    });
    it('should throw HttpException if HttpException error occurs while updating restaurant address', async () => {
      (mockRestaurantAddressModel.updateRestaurantAddressEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await restaurantAddressService.updateRestaurantAddress(ADDRESS_REQUEST, FR_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantAddressModel.updateRestaurantAddressEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists while updating restaurant address', async () => {
      (mockRestaurantAddressModel.updateRestaurantAddressEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantAddressService.updateRestaurantAddress(ADDRESS_REQUEST, FR_COUNTRY_ENTITY, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantAddressModel.updateRestaurantAddressEntity).toHaveBeenCalledTimes(1);
    });
  });
});
