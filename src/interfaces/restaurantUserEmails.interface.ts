import { NextFunction, Request, Response } from 'express';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';
import { EntityManager } from 'typeorm';

export interface RestaurantUserEmailsControllerInterface {
  getRestaurantUserEmails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface RestaurantUserEmailsServiceInterface {
  getRestaurantUserEmails: (restaurantID: number) => Promise<RestaurantUserEmailsResponseInterface[]>;
}

export interface RestaurantUserEmailsModelInterface {
  fetchRestaurantUserEmailsByRestaurantID: (restaurantUrlID: string, repository?: EntityManager) => Promise<RestaurantUserEmailEntity[]>;
}

export interface RestaurantUserEmailsDBInterface {
  id: number;
  email: string;
  restaurant_url_id: string;
  created_at?: string;
  user_id?: number;
}

export interface RestaurantUserEmailsResponseInterface {
  id: number;
  email: string;
  createdAt?: string;
  userID?: number;
}
