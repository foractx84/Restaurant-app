import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  CreateRestaurantAddressRequestInterface,
  EditRestaurantAddressRequestInterface,
  RestaurantAddressModelInterface,
  RestaurantAddressServiceInterface,
} from '@/interfaces/restaurantAddress.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';
import { getLatLongGeocoderFromAddress } from '@utils/geocoder';
import { CountryEntity } from '@/entities/country.entity';

class RestaurantAddressService implements RestaurantAddressServiceInterface {
  private restaurantAddressModel: RestaurantAddressModelInterface;

  constructor(restaurantAddressModel: RestaurantAddressModelInterface) {
    this.restaurantAddressModel = restaurantAddressModel;
  }

  createRestaurantAddress = async (
    restaurantAddress: CreateRestaurantAddressRequestInterface,
    country: CountryEntity,
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<RestaurantAddressEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const { country_id } = country;

      const [latitude, longitude] = await this.geocodeRestaurantAddress(restaurantAddress, country, restaurantID);

      return await this.restaurantAddressModel.insertRestaurantAddressEntity(
        this.buildRestaurantAddressEntity(restaurantAddress, latitude, longitude, country_id, restaurantID),
        repository,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while inserting restaurant address ${JSON.stringify(restaurantAddress)}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting restaurant address ${JSON.stringify(restaurantAddress)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  geocodeRestaurantAddress = async (
    restaurantAddress: CreateRestaurantAddressRequestInterface,
    country: CountryEntity,
    restaurantID?: number,
  ): Promise<number[]> => {
    try {
      const { address1, city, governingDistrict, postalCode, coordinates } = restaurantAddress;
      const { lat, long } = coordinates || {};
      const { name: countryName } = country;

      let latitude = lat || null;
      let longitude = long || null;
      // if lat and long not provided and country is United States, then use the node-geocoder to acquire lat and long
      if ((lat == null || long == null || isNaN(lat) || isNaN(long)) && countryName.toLowerCase() === 'united states') {
        // original address format passed in from v0 backend -> `${restaurant.address}, ${restaurant.city}, ${restaurant.state}, ${restaurant.zipCode}`
        const [newLatitude, newLongitude] = await getLatLongGeocoderFromAddress(
          `${address1}, ${city}, ${governingDistrict}, ${postalCode}`,
          restaurantID,
        );
        if (!newLatitude || !newLongitude) {
          throw new HttpException(
            422,
            getErrorPayload(
              InternalErrorCode.unprocessableContent,
              `Error occurred while geocoding restaurant address ${JSON.stringify(
                restaurantAddress,
              )} located in the US.  Double check that the address is correct.`,
            ),
          );
        }
        latitude = newLatitude || null;
        longitude = newLongitude || null;
      }

      return [latitude, longitude];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while geocoding restaurant address ${JSON.stringify(restaurantAddress)}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while geocoding restaurant address ${JSON.stringify(restaurantAddress)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getRestaurantAddressByRestaurantID = async (restaurantID: number): Promise<RestaurantAddressEntity> => {
    try {
      return await this.restaurantAddressModel.fetchRestaurantAddressByRestaurantID(restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting restaurant address by restaurant id: ${restaurantID}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting restaurant address by restaurant id: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  updateRestaurantAddress = async (
    restaurantAddress: EditRestaurantAddressRequestInterface,
    country: CountryEntity,
    restaurantID: number,
    repository?: EntityManager,
  ) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const { country_id } = country;

      const [latitude, longitude] = await this.geocodeRestaurantAddress(restaurantAddress, country, restaurantID);

      await this.restaurantAddressModel.updateRestaurantAddressEntity(
        this.buildRestaurantAddressEntity(restaurantAddress, latitude, longitude, country_id, restaurantID),
        restaurantAddress.restaurantAddressID,
        repository,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while updating restaurant address: ${restaurantAddress?.restaurantAddressID} - ${JSON.stringify(
            restaurantAddress,
          )} of restaurantID: ${restaurantID}.` + err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting restaurant address: ${restaurantAddress?.restaurantAddressID} -  ${JSON.stringify(
              restaurantAddress,
            )} of restaurantID: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  /**
   * Build Restaurant Address Entity from CreateRestaurantAddressRequestInterface
   * @param address
   * @param latitude
   * @param longitude
   * @param countryID
   * @param restaurantID
   */
  buildRestaurantAddressEntity = (
    address: CreateRestaurantAddressRequestInterface,
    latitude: number,
    longitude: number,
    countryID: number,
    restaurantID: number,
  ): RestaurantAddressEntity => ({
    restaurant_id: restaurantID,
    address1: address?.address1,
    address2: address?.address2 || null,
    street_number: address?.streetNumber || null,
    street_name: address?.streetName || null,
    city: address?.city || null,
    governing_district: address?.governingDistrict || null,
    country_id: countryID,
    postal_code: address?.postalCode || null,
    lat: latitude || null,
    long: longitude || null,
    timezone: address?.timezone || 'America/New_York',
  });
}

export default RestaurantAddressService;
