import { RestaurantPackageEntity } from '@/entities/restaurantPackage.entity';
import { EntityManager } from 'typeorm';

export interface RestaurantPackageServiceInterface {
  checkRestaurantAlreadyHasPackage: (packageID: number, restaurantID: number) => Promise<void>;
  createRestaurantPackage: (packageID: number, restaurantID: number, repository?: EntityManager) => Promise<RestaurantPackageEntity>;
  deactivateRestaurantPackage: (restaurantPackageID: number, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantPackageModelInterface {
  getRestaurantPackageByPackageIDAndRestaurantID: (
    packageID: number,
    restaurantID: number,
    repository?: EntityManager,
  ) => Promise<RestaurantPackageEntity>;
  insertRestaurantPackageEntity: (restaurantPackageEntity: RestaurantPackageEntity, repository?: EntityManager) => Promise<RestaurantPackageEntity>;
  deactivateRestaurantPackage: (restaurantPackageID: number, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantPackageDBInterface {
  restaurant_package_id?: number;
  restaurant_id?: number;
  package_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}
