import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { MenuDisclaimerEntity } from '@/entities/disclaimer.entity';
import { MenuDisclaimerTypeEntity } from '@/entities/disclaimerType.entity';
import { EntityManager } from 'typeorm';
import { MenuDisclaimer } from '@/enums/menuDisclaimer';

export interface MenuDisclaimerServiceInterface {
  deleteMenuDisclaimers: (disclaimersToDelete: number[], menuID: number, repository?: EntityManager) => Promise<void>;
  editMenuDisclaimers: (
    disclaimers: EditMenuDisclaimersInterface,
    menuID: number,
    repository?: EntityManager,
  ) => Promise<InsertedDisclaimersEditMenusInterface>;
  getAllMenuDisclaimersByMenuID: (menuID: number, repository?: EntityManager) => Promise<MenuDisclaimerInterface[]>;
  getMenuDisclaimerByIDAndMenuID: (messageID: number, menuID: number, repository: EntityManager) => Promise<MenuDisclaimerEntity>;
  insertMenuDisclaimers: (
    menuDisclaimers: CreateMenuDisclaimersInterface[],
    menuID: number,
    repository: PostgresQueriesRepository,
  ) => Promise<MenuDisclaimerDBInterface[]>;
}

export interface MenuDisclaimerModelInterface {
  deleteMenuDisclaimers: (disclaimersToDelete: number[], menuID: number, repository?: EntityManager) => Promise<void>;
  getAllMenuDisclaimersEntityByMenuID: (menuID, repository: EntityManager) => Promise<MenuDisclaimerEntity[]>;
  getMenuDisclaimerByIDAndMenuID: (messageID: number, menuID: number, repository: EntityManager) => Promise<MenuDisclaimerEntity>;
  getMenuDisclaimerType: (position: string) => Promise<MenuDisclaimerTypeEntity>;
  insertMenuDisclaimers: (menuDisclaimers: MenuDisclaimerEntity[], repository: PostgresQueriesRepository) => Promise<MenuDisclaimerDBInterface[]>;
  updateMenuDisclaimers: (menuDisclaimersEntityArray: MenuDisclaimerEntity[], repository?: EntityManager) => Promise<void>;
}

export interface CreateMenuDisclaimersInterface {
  message: string;
  position: string;
}

export interface CreateMenuDisclaimersResponseInterface {
  message: string;
  position?: string;
  messageID: number;
}

export interface EditMenuDisclaimersInterface {
  DELETE: number[];
  INSERT: CreateMenuDisclaimersInterface[];
  UPDATE: CreateMenuDisclaimersResponseInterface[];
}

export interface MenuDisclaimerDBInterface {
  position?: MenuDisclaimer;
  message_id: number;
  menu_id: number;
  message: string;
  message_type_id: number;
}

export interface MenuDisclaimerInterface {
  messageID: number;
  menuID: number;
  message: string;
  messageTypeID?: number;
  position?: number;
}

export interface InsertedDisclaimersEditMenusInterface {
  insertedDisclaimers: CreateMenuDisclaimersResponseInterface[];
}
