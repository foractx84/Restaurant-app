import { MenuLayoutEntity } from '@/entities/menuLayout.entity';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import { MenuLayout } from '@/enums/menuLayout';
import { Request, Response, NextFunction } from 'express';
import { EntityManager } from 'typeorm';

export interface MenuLayoutControllerInterface {
  getAllMenuLayouts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateRestaurantMenuLayout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface MenuLayoutServiceInterface {
  getAllMenuLayouts: () => Promise<MenuLayoutInterface[]>;
  updateRestaurantMenuLayout: (layoutID: number, restaurantID: number) => Promise<void>;
}

export interface MenuLayoutModelInterface {
  getAllMenuLayouts: () => Promise<MenuLayoutEntity[]>;
  getMenuLayoutByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantMenuLayoutEntity>;
  updateMenuLayoutOfRestaurant: (layoutID: number, restaurantID: number, repository?: EntityManager) => Promise<void>;
}

export interface MenuLayoutDBInterface {
  menu_layout_id?: number;
  layout: MenuLayout;
}

export interface MenuLayoutInterface {
  layoutID: number;
  name: string;
}

export interface UpdateRestaurantMenuLayoutRequestInterface {
  layoutID: number;
}
