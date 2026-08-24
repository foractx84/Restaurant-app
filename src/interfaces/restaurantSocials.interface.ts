import { RestaurantSocialsEntity } from '@/entities/restaurantSocials.entity';
import { EntityManager } from 'typeorm';

export interface RestaurantSocialsServiceInterface {
  createRestaurantSocials: (restaurantSocials: RestaurantSocialsInterface, repository?: EntityManager) => Promise<RestaurantSocialsEntity>;
  getRestaurantSocialsByRestaurantID: (restaurantSocialsID: number, repository?: EntityManager) => Promise<RestaurantSocialsInterface>;
  updateRestaurantSocials: (restaurantSocials: RestaurantSocialsInterface, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantSocialsModelInterface {
  getRestaurantSocialsByRestaurantID: (restaurantSocialsID: number, repository?: EntityManager) => Promise<RestaurantSocialsEntity>;
  insertRestaurantSocials: (restaurantSocials: RestaurantSocialsDBInterface, repository?: EntityManager) => Promise<RestaurantSocialsEntity>;
  updateRestaurantSocials: (restaurantSocials: RestaurantSocialsDBInterface, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantSocialsDBInterface {
  restaurant_socials_id?: number;
  restaurant_id?: number;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RestaurantSocialsInterface {
  restaurantSocialsID?: number;
  restaurantID?: number;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantSocialsRequestInterface {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
}
