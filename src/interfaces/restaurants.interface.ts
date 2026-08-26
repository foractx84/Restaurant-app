import { RestaurantEntity } from '@/entities/restaurant.entity';
import { NextFunction, Request, Response } from 'express';
import { GetRestaurantMenuResponse } from '@interfaces/menus.interface';
import { EntityManager } from 'typeorm';
import { GetRestaurantMenuLayoutInterface } from './restaurantMenuLayout.interface';
import {
  CreateRestaurantAddressRequestInterface,
  EditRestaurantAddressRequestInterface,
  RestaurantAddressInterface,
} from './restaurantAddress.interface';
import { CuisineInterface } from '@interfaces/cuisines.interface';
import { RestaurantImageDetailsInterface, RestaurantImagesInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantSocialsInterface, RestaurantSocialsRequestInterface } from './restaurantSocials.interface';
import { CreateHoursInterface } from './militaryHours.interface';
import { GetProfilePageResponseInterface } from './profilePages.interface';

export interface RestaurantControllerInterface {
  createRestaurant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editRestaurant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getRestaurantDetails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  readRestaurants: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  backupRestaurantMenus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  uploadRestaurantImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkStripeConnectAccount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getStripeConnectOnboardingUrl: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getRestaurantFontSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  saveRestaurantFontSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getRestaurantColorSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  saveRestaurantColorSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface RestaurantsServiceInterface {
  createRestaurant: (managerID: number, restaurant: CreateRestaurantRequestInterface, isSuper: boolean) => Promise<CreateRestaurantResponseInterface>;
  createRestaurantWithoutManager: (restaurant: CreateRestaurantRequestInterface) => Promise<CreateRestaurantResponseInterface>;
  editRestaurant: (restaurant: EditRestaurantRequestInterface, restaurantID: number) => Promise<void>;
  getRestaurantDetails: (restaurantID: number) => Promise<GetRestaurantDetailResponse>;
  findRestaurantsByManagerID: (managerID: number, isSuper?: boolean) => Promise<GetRestaurantsResponse>;
  findRestaurantEntityByID: (restaurantID: number) => Promise<RestaurantEntity>;
  findRestaurantEntityByIDAndLocationID: (restaurantID: number, locationID: number, manager?: EntityManager) => Promise<RestaurantEntity>;
  findRestaurantEntityWithModifiersByID: (restaurantID: number, manager?: EntityManager) => Promise<RestaurantEntity>;
  uploadRestaurantImages: (
    galleryImages: string[],
    galleryImagesToDelete: number[],
    galleryOrder: string[],
    imagesToDelete: number[],
    logoImage: string,
    menuCoverImage: string,
    profileImages: string[],
    restaurantID: number,
    thumbnailImage: string,
  ) => Promise<RestaurantImagesInterface>;
  updateRestaurantEntity: (patch: Partial<RestaurantEntity>, restaurantID: number) => Promise<void>;
  /** Reads the storefront availability flag (`false` == paused). Throws 404 when the restaurant does not exist. */
  findRestaurantAcceptingOrders: (restaurantID: number) => Promise<boolean>;
  /** Sets the storefront availability flag (`false` == paused). */
  setRestaurantAcceptingOrders: (restaurantID: number, isAcceptingOrders: boolean) => Promise<void>;
  verifyRestaurants: (restaurantIDs: number[]) => Promise<number[]>; // returns verified restaurant ids
  findRestaurantEntityByNameAndAddress: (
    name: string,
    address1: string,
    city: string,
    governingDistrict: string,
    countryName: string,
    postalCode: string,
  ) => Promise<RestaurantEntity | null>;
}

export interface RestaurantBackupServiceInterface {
  generateRestaurantBackups: () => Promise<void>;
}

export interface RestaurantsModelInterface {
  getRestaurantByID: (restaurantID: number) => Promise<RestaurantsDBInterface>;
  getRestaurantByNameAndAddress: (
    name: string,
    address1: string,
    city: string,
    governingDistrict: string,
    countryID: number,
    postalCode: string,
    repository?: EntityManager,
  ) => Promise<RestaurantEntity>;
  getRestaurantDetailsEntityByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantEntity>;
  getRestaurantEntityByID: (restaurantID: number) => Promise<RestaurantEntity>;
  getRestaurantEntityByIDAndLocationID: (restaurantID: number, locationID: number, manager?: EntityManager) => Promise<RestaurantEntity>;
  getRestaurantEntityWithModifiersByID: (restaurantID: number, manager?: EntityManager) => Promise<RestaurantEntity>;
  getRestaurantsForBackup: () => Promise<RestaurantEntity[]>;
  getRestaurantsEntityByManagerID: (managerID: number, isSuper: boolean, repository?: EntityManager) => Promise<RestaurantEntity[]>;
  insertRestaurantEntity: (restaurant: RestaurantEntity, repository?: EntityManager) => Promise<RestaurantEntity>;
  updateRestaurantEntity: (restaurant: Partial<RestaurantEntity>, restaurantID: number, repository?: EntityManager) => Promise<void>;
  /** Lean read of the storefront availability flag. `null` when the restaurant does not exist. */
  getRestaurantAcceptingOrdersByID: (restaurantID: number, repository?: EntityManager) => Promise<boolean | null>;
  updateRestaurantAcceptingOrders: (restaurantID: number, isAcceptingOrders: boolean, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantsDBInterface {
  // DB results
  restaurantID?: number;
  reservation_url?: string;
  ordering_url?: string;
}

export interface GetRestaurantsResponse {
  restaurants: GetRestaurantResponse[];
}

export interface GetRestaurantDetailResponse {
  restaurantUrlID: string;
  restaurantID: number;
  name: string;
  isPublished: boolean;
  currency: RestaurantCurrencyInterface;
  description: string;
  phone: string;
  email: string;
  website: string;
  cuisine: CuisineInterface;
  address: RestaurantAddressInterface;
  images: RestaurantImageDetailsInterface;
  menus: GetRestaurantMenuResponse[];
  menuLayout: GetRestaurantMenuLayoutInterface;
  socials: RestaurantSocialsInterface;
  restaurantHours: CreateHoursInterface[];
  availabilityNotes: string;
  reservationUrl: string;
  orderingUrl: string;
  primaryTagline: string;
  secondaryTagline: string;
  pages: GetProfilePageResponseInterface[];
}

export interface GetRestaurantResponse {
  restaurantUrlID: string;
  restaurantID: number;
  name: string;
}

export interface CreateRestaurantRequestInterface {
  name: string;
  description?: string;
  phone: string;
  email: string;
  cuisineID: number;
  website?: string;
  address: CreateRestaurantAddressRequestInterface;
  socials?: RestaurantSocialsRequestInterface;
  restaurantHours?: CreateHoursInterface[];
  availabilityNotes?: string;
  reservationUrl?: string;
  orderingUrl?: string;
}

export interface CreateRestaurantResponseInterface {
  restaurantID: number;
  restaurantUrlID: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  isPublished: boolean;
  cuisine: CuisineInterface;
  website: string;
  address: RestaurantAddressInterface;
  currency: RestaurantCurrencyInterface;
  socials?: RestaurantSocialsRequestInterface;
  restaurantHours?: CreateHoursInterface[];
  availabilityNotes: string;
  stripeOnboardingUrl?: string;
  stripeAccountId?: string;
}

export interface EditRestaurantRequestInterface {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  cuisineID?: number;
  website?: string;
  address?: EditRestaurantAddressRequestInterface;
  socials?: RestaurantSocialsRequestInterface;
  restaurantHours?: CreateHoursInterface[];
  availabilityNotes?: string;
  primaryTagline?: string;
  secondaryTagline?: string;
}

export interface RestaurantCurrencyInterface {
  code: string;
  symbol: string;
}
