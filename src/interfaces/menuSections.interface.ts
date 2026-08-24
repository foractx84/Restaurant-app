import { NextFunction, Request, Response } from 'express';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { GetMenuItemsByMenuSectionInterface } from '@/interfaces/menuItem.interface';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { EntityManager } from 'typeorm';

export interface MenuSectionsControllerInterface {
  createMenuSections: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteMenuSection: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editMenuSection: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  hideMenuSection: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reorderMenuSections: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface MenuSectionsServiceInterface {
  buildMenuSectionResponse: (menuSections: MenuSectionsDBInterface[]) => MenuSections[];
  createMenuSections: (names: MenuSections[], menuID: number, manager?: EntityManager) => Promise<CreateMenuSectionsInterface>;
  deleteMenuSection: (menuSectionID: number) => Promise<void>;
  editMenuSection: (menuID: number, menuSectionID: number, menuSectionName: string, message?: string, manager?: EntityManager) => Promise<void>;
  getMenuSectionEntityByID: (menuSectionID: number) => Promise<MenuSectionEntity>;
  getMenuSectionByExternalID: (externalID: string, manager?: EntityManager) => Promise<MenuSectionEntity>;
  getMenuSectionsForMenuDetails: (menuID: number) => Promise<GetMenuSectionsForMenuDetailsInterface[]>;
  hideMenuSection: (menuSectionID: number, hide: boolean) => Promise<void>;
  insertMenuSections: (
    menuSectionNames: MenuSections[],
    menuID: number,
    repository?: PostgresQueriesRepository,
  ) => Promise<MenuSectionsDBInterface[]>;
  reorderMenuSections: (menuID: number, menuSectionsOrder: number[], manager?: EntityManager) => Promise<void>;
}

export interface MenuSectionsModelInterface {
  deleteMenuSection: (menuSectionID: number) => Promise<void>;
  findMenuSectionByIDAndRestaurantID: (menuSectionID: number, restaurantID: number) => Promise<MenuSectionEntity>;
  findMenuSectionEntityByID: (menuSectionID: number) => Promise<MenuSectionEntity>;
  getMenuSectionsByMenuID: (menuID: number, manager?: EntityManager) => Promise<GetMenuSectionsForMenuDetailsDBInterface[]>;
  getMenuSectionByExternalID: (externalID: string, manager?: EntityManager) => Promise<MenuSectionEntity>;
  hideMenuSection: (menuSectionID: number, hide: boolean, repository?: EntityManager) => Promise<void>;
  insertAllMenuSections: (menuSections: MenuSectionEntity[], repository: PostgresQueriesRepository) => Promise<MenuSectionsDBInterface[]>;
  insertMenuSections: (menuSections: MenuSectionEntity[], manager?: EntityManager) => Promise<MenuSectionEntity[]>;
  updateMenuSectionsListOrder: (sections: ReorderMenuSectionsQueryInterface[], repository?: EntityManager) => Promise<void>;
  updateMenuSectionName: (menuSectionID: number, name: string, message?: string, repository?: EntityManager) => Promise<void>;
}

export interface MenuSections {
  menuSectionID?: number;
  name: string;
  menuID?: number;
  listOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
  isHidden?: string;
  externalID?: string;
}

export interface MenuSectionsDBInterface {
  menu_section_id: number;
  name: string;
  menu_id: number;
  created_at: string;
  updated_at: string;
  list_order: number;
  message?: string;
  is_hidden?: boolean;
  external_id?: string;
}

export interface GetMenuSectionsForMenuDetailsDBInterface {
  menu_section_id: number;
  section_name: string;
  message?: string;
  is_hidden?: boolean;
  external_id?: string;
}

export interface GetMenuSectionsForMenuDetailsInterface {
  menuSectionID: number;
  sectionName: string;
  isHidden?: boolean;
  message?: string;
  externalID?: string;
  items?: GetMenuItemsByMenuSectionInterface[];
}

export interface GetRestaurantMenuSectionResponse {
  name: string;
  menuSectionID: number;
}

export interface CreateMenuSectionsRequestInterface {
  menuID: number;
  menuSections: MenuSectionNameAndMessageInterface[];
}

export interface CreateMenuSectionsInterface {
  menuID: number;
  menuSections: MenuSections[];
}

export interface DeleteMenuSectionsRequestInterface {
  menuSectionID: number;
}

export interface ReorderMenuSectionsRequestInterface {
  menuID: number;
  menuSectionsOrder: number[];
}

export interface ReorderMenuSectionsQueryInterface {
  menu_section_id: number;
  list_order: number;
}
export interface EditMenuSectionRequestInterface {
  menuID: number;
  menuSectionID: number;
  menuSectionName: string;
  message?: string;
}

export interface MenuSectionNameAndMessageInterface {
  name: string;
  message?: string;
}

export interface MenuSectionNameAndMessageInterface {
  name: string;
  message?: string;
}

export interface HideMenuSectionRequestInterface {
  menuSectionID: number;
  hide: boolean;
}
