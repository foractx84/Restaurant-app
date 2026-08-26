import { RestaurantHoursEntity } from '@/entities/restaurantHours.entity';
import { Day } from '@/enums/day';
import { EntityManager } from 'typeorm';
import { CreateHoursInterface } from './militaryHours.interface';

export interface RestaurantHoursServiceInterface {
  buildCreateRestaurantHoursResponse: (restaurantHoursEntities: RestaurantHoursEntity[]) => CreateHoursInterface[];
  createRestaurantHours: (
    restaurantHours: CreateHoursInterface[],
    restaurantID: number,
    repository?: EntityManager,
  ) => Promise<RestaurantHoursEntity[]>;
  removeRestaurantHours: (restaurantID: number, repository?: EntityManager) => Promise<void>;
  /** Reads a restaurant's operating-hours rows (one per day/window). Used to answer Otter's store-hours webhook. */
  findRestaurantHoursByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantHoursEntity[]>;
}

export interface RestaurantHoursModelInterface {
  deleteRestaurantHours: (restaurantID: number, repository?: EntityManager) => Promise<void>;
  getRestaurantHoursByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantHoursEntity[]>;
  insertRestaurantHours: (restaurantHours: RestaurantHoursDBInterface[], repository?: EntityManager) => Promise<RestaurantHoursEntity[]>;
}

export interface RestaurantHoursDBInterface {
  restaurant_hours_id?: number;
  restaurant_id?: number;
  day: Day;
  start: string;
  end: string;
  created_at?: string;
  updated_at?: string;
}
