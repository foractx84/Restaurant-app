import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';
import { EntityManager } from 'typeorm';

export interface RestaurantProfileMediaServiceInterface {
  softDeleteRestaurantProfileMediaBySectionID: (profileSectionID: number, repository?: EntityManager) => Promise<void>;
  insertRestaurantProfileMediaForPageSection: (mediaIDs: number[], sectionID: number, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantProfileMediaModelInterface {
  softDeleteRestaurantProfileMediaBySectionID: (profileSectionID: number, repository?: EntityManager) => Promise<void>;
  insertRestaurantProfileMediaForPageSection: (
    restaurantProfileMediaEntity: RestaurantProfileMediaEntity[],
    repository?: EntityManager,
  ) => Promise<void>;
}

export interface CreateRestaurantProfileMediaRequestInterface {
  restaurantProfileMediaID?: number;
  restaurantProfileSectionID: number;
  mediaID: number;
  listOrder?: number;
}

export interface RestaurantProfileMediaInterface {
  restaurantProfileMediaID: number;
  restaurantProfileSectionID: number;
  mediaID: number;
  listOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
