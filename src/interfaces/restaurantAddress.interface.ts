import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { EntityManager } from 'typeorm';
import { CountryEntity } from '@/entities/country.entity';

export interface RestaurantAddressServiceInterface {
  createRestaurantAddress: (
    restaurantAddress: CreateRestaurantAddressRequestInterface,
    country: CountryEntity,
    restaurantID: number,
    repository?: EntityManager,
  ) => Promise<RestaurantAddressEntity>;
  geocodeRestaurantAddress: (
    restaurantAddress: CreateRestaurantAddressRequestInterface,
    country: CountryEntity,
    restaurantID?: number,
  ) => Promise<number[]>;
  getRestaurantAddressByRestaurantID: (restaurantID: number) => Promise<RestaurantAddressEntity>;
  updateRestaurantAddress: (
    restaurantAddress: EditRestaurantAddressRequestInterface,
    country: CountryEntity,
    restaurantID: number,
    repository?: EntityManager,
  ) => Promise<void>;
}

export interface RestaurantAddressModelInterface {
  fetchRestaurantAddressByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantAddressEntity>;
  fetchRestaurantAddressByRestaurantAddressIDAndByRestaurantID: (
    restaurantAddressID: number,
    restaurantID: number,
    repository?: EntityManager,
  ) => Promise<RestaurantAddressEntity>;
  insertRestaurantAddressEntity: (address: RestaurantAddressEntity, repository?: EntityManager) => Promise<RestaurantAddressEntity>;
  updateRestaurantAddressEntity: (address: RestaurantAddressEntity, restaurantAddressID: number, repository?: EntityManager) => Promise<void>;
}

export interface CoordinatesInterface {
  lat?: number;
  long?: number;
}

export interface CreateRestaurantAddressRequestInterface {
  address1: string;
  address2?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  governingDistrict?: string;
  country: string;
  postalCode?: string;
  coordinates?: CoordinatesInterface;
  timezone?: string;
}

export interface EditRestaurantAddressRequestInterface extends CreateRestaurantAddressRequestInterface {
  restaurantAddressID: number;
}

export interface RestaurantAddressInterface {
  restaurantAddressID?: number;
  address1: string;
  address2?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  governingDistrict?: string;
  country: string;
  postalCode?: string;
  coordinates?: CoordinatesInterface;
  timezone?: string;
}
