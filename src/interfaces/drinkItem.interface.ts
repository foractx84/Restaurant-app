import { NextFunction, Request, Response } from 'express';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { EntityManager } from 'typeorm';

export interface DrinkItemControllerInterface {
  getDrinkItems: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface DrinkItemServiceInterface {
  getDrinkItemsByIDsAndRestaurantID: (drinkItemIDs: number[], restaurantID: number) => Promise<MenuItemEntity[]>;
  getDrinkItemsByRestaurantID: (restaurantID: number) => Promise<GetDrinkItemsInterface[]>;
  validatePairings: (pairingItemIDs: number[], restaurantID: number) => Promise<void>;
}

export interface DrinkItemModelInterface {
  getDrinkItemsByIDsAndRestaurantID: (drinkItemIDs: number[], restaurantID: number, repository?: EntityManager) => Promise<MenuItemEntity[]>;
  getDrinkItemsByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<MenuItemEntity[]>;
}

export interface GetDrinkItemsInterface {
  name: string;
  drinkItemID: number;
  isHidden: boolean;
}
