import { EntityManager } from 'typeorm';

export interface ManagerRestaurantServiceInterface {
  insertManagerRestaurantEntity: (managerID: number, restaurantID: number, repository?: EntityManager) => Promise<void>;
}

export interface ManagerRestaurantModelInterface {
  insertManagerRestaurantEntity: (managerID: number, restaurantID: number, repository?: EntityManager) => Promise<void>;
}
