import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { RestaurantPageOrderEntity } from '@/entities/restaurantPageOrder.entity';

// The stable identifiers of the orderable white-label website nav pages. Shared (by value) with the
// TapManager-Frontend PAGES constant and the TapTab website nav. NOT a profile_pages FK, because the
// orderable set spans both profile pages (about/press) and flag-driven feature pages
// (events/catering/careers).
export const ORDERABLE_PAGE_KEYS = ['menu', 'contact', 'about', 'press', 'events', 'catering', 'careers'] as const;
export type OrderablePageKey = (typeof ORDERABLE_PAGE_KEYS)[number];

export interface RestaurantPageOrderDBInterface {
  restaurant_page_order_id?: number;
  restaurant_id: number;
  page_key: string;
  list_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PageOrderResponseInterface {
  // Page keys in saved display order (ascending). Keys without a saved row are omitted; the
  // frontend/website merge these against their default order.
  order: string[];
}

export interface UpdatePageOrderRequestInterface {
  order: string[];
}

export interface PageOrderControllerInterface {
  getPageOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updatePageOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface PageOrderServiceInterface {
  getPageOrder: (restaurantID: number) => Promise<PageOrderResponseInterface>;
  updatePageOrder: (restaurantID: number, update: UpdatePageOrderRequestInterface) => Promise<PageOrderResponseInterface>;
}

export interface PageOrderModelInterface {
  fetchByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantPageOrderEntity[]>;
  replaceForRestaurant: (restaurantID: number, orderedKeys: string[], repository?: EntityManager) => Promise<RestaurantPageOrderEntity[]>;
}
