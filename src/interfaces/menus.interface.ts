import { NextFunction, Request, Response } from 'express';
import { MenuHours, MenuHoursDBInterface } from './menuHours.interface';
import { GetRestaurantMenuSectionResponse, MenuSections, MenuSectionsDBInterface } from './menuSections.interface';
import { GetMenuSectionsForMenuDetailsInterface } from './menuSections.interface';

import { EditMenuDisclaimersInterface, InsertedDisclaimersEditMenusInterface } from './disclaimers.interface';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { EntityManager } from 'typeorm';
import { CreateMenuDisclaimersInterface, CreateMenuDisclaimersResponseInterface, MenuDisclaimerDBInterface } from './disclaimers.interface';
import { MenuDisclaimerInterface } from './disclaimers.interface';
import { MenuEntity } from '@/entities/menus.entity';
import { FileGenerationType } from '@/enums/fileGenerationType';

export interface MenusControllerInterface {
  createMenus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getMenuDetails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  generateFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteMenu: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editMenu: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  hideMenu: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reorderMenus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface MenusServiceInterface {
  createMenus: (menus: CreateMenusRequestInterface, restaurantID: number, manager?: EntityManager) => Promise<CreateAllMenusInterface>;
  getMenuDetails: (menuID: number, includeHidden?: boolean) => Promise<GetMenuDetailsResponseInterface>;
  generateFile: (fileFormat: FileGenerationType, menuID: number, fileName?: string) => Promise<GetMenuDetailsGenerateFileInterface>;
  deleteMenu: (menuID: number, restaurantID: number) => Promise<void>;
  getMenuByMenuID: (menuID: number) => Promise<GetMenuByMenuIDInterface>;
  getMenuByExternalID: (externalID: string, manager?: EntityManager) => Promise<MenuEntity>;
  editMenu: (menuRequest: EditMenuRequestInterface, manager?: EntityManager) => Promise<InsertedDisclaimersEditMenusInterface>;
  getMenuByMenuIDAndRestaurantID: (menuID: number, restaurantID: number) => Promise<MenusInterface>;
  hideMenu: (menuID: number, hide: boolean) => Promise<void>;
  reorderMenus: (restaurantID: number, menusOrder: number[], manager?: EntityManager) => Promise<void>;
}

export interface MenusModelsInterface {
  deleteMenu: (menuID: number, restaurantID: number) => Promise<void>;
  editMenu: (menuRequest: EditMenuRequestInterface, manager?: EntityManager) => Promise<InsertedDisclaimersEditMenusInterface>;
  insertMenu: (menu: Menus, restaurantID: number, repository: PostgresQueriesRepository) => Promise<MenusDBInterface>;
  insertMenuTransaction: (menu: Menus, restaurantID: number, manager?: EntityManager) => Promise<CreateMenusDBInterface>;
  getMenuByExternalID: (externalID: string, manager?: EntityManager) => Promise<MenuEntity>;
  getMenuByMenuID: (menuID: number) => Promise<MenuEntity>;
  getMenuByMenuIDAndRestaurantID: (menuID: number, restaurantID: number) => Promise<MenusDBInterface>;
  getMenusEntitiesByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<MenuEntity[]>;
  hideMenu: (menuID: number, hide: boolean, respository?: EntityManager) => Promise<void>;
  updateMenuNameAndPrixFixeByMenuID: (menuID: number, name: string, isPrixFixe: boolean, repository?: EntityManager) => Promise<void>;
  updateMenusListOrder: (menus: ReorderMenusQueryInterface[], repository?: EntityManager) => Promise<void>;
}

export interface MenusInterface {
  // DB params
  menuID: number;
  name: string;
  restaurantID: number;
  listOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  isPrixFixe?: boolean;
  isHidden?: boolean;
}
export interface MenusDBInterface {
  // DB results
  menu_id: number;
  name: string;
  restaurant_id: number;
  list_order: number;
  created_at: string;
  updated_at: string;
  is_prix_fixe?: boolean;
  is_hidden?: boolean;
  external_id?: string;
}
export interface Menus {
  name: string;
  isPrixFixe?: boolean;
  isHidden?: boolean;
  menuHours: MenuHours[];
  menuSections: MenuSections[];
  disclaimers: CreateMenuDisclaimersInterface[];
  externalID?: string;
}
export interface CreateMenusRequestInterface {
  // Request params
  menus: Menus[];
}
export interface CreateMenusDBInterface extends MenusDBInterface {
  menuSections: MenuSectionsDBInterface[];
  menuHours: MenuHoursDBInterface[];
  disclaimers: MenuDisclaimerDBInterface[];
}
// for camelCase reponse if we change response format for this endpoint
export interface CreateOneMenuInterface extends MenusInterface {
  menuSections: MenuSections[];
  menuHours: MenuHours[];
  disclaimers: CreateMenuDisclaimersResponseInterface[];
}

export interface CreateAllMenusInterface {
  menus: CreateOneMenuInterface[];
}

// get menu details
export interface GetMenuDetailsRequestInterface {
  menuID: number;
}

export interface GetMenuDetailsResponseInterface extends GetMenuByMenuIDInterface {
  messages: MenuDisclaimerInterface[];
  menuSections: GetMenuSectionsForMenuDetailsInterface[];
}

export interface GetMenuByMenuIDInterface {
  isPrixFixe: boolean;
  menuID: number;
  menuName: string;
  restaurantID: number;
  isHidden: boolean;
  externalID?: string;
}

export interface DeleteMenuRequestInterface {
  menuID: number;
}

export interface GetRestaurantMenuResponse {
  menuName: string;
  menuID: number;
  menuSections: GetRestaurantMenuSectionResponse[];
  isPrixFixe: boolean;
  isHidden: boolean;
}

export interface EditMenuRequestInterface {
  menuID: number;
  name: string;
  menuHours: MenuHours[];
  disclaimers: EditMenuDisclaimersInterface;
  isPrixFixe: boolean;
}

export interface HideMenuRequestInterface {
  menuID: number;
  hide: boolean;
}

export interface ReorderMenusRequestInterface {
  menusOrder: number[];
}

export interface ReorderMenusQueryInterface {
  list_order: number;
  menu_id: number;
}

export class GenerateMenuFileInterface {
  menuID: number;
  fileFormat: FileGenerationType;
}

export interface GetMenuDetailsGenerateFileInterface {
  fileURL: string;
}
