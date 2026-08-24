import { MenuHoursEntity } from '@/entities/menuHours.entity';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { EntityManager } from 'typeorm';

export interface MenuHoursModelInterface {
  getMenuHoursEntityByMenuID: (menuID: number, repository: EntityManager) => Promise<MenuHoursEntity[]>;
  hardDeleteMenuHoursByMenuHourIDs: (hourIDs: number[], repository?: EntityManager) => Promise<void>;
  hardDeleteMenuHoursByMenuID: (menuID: number, repository?: EntityManager) => Promise<void>;
  insertAllMenuHours: (menuHours: MenuHoursEntity[], repository?: PostgresQueriesRepository) => Promise<MenuHoursDBInterface[]>;
  updateMenuHour: (menuHour: Partial<MenuHoursEntity>, manager?: EntityManager) => Promise<void>;
}

export interface MenuHoursServiceInterface {
  getMenuHoursByMenuID: (menuID: number, repository?: EntityManager) => Promise<MenuHours[]>;
  hardDeleteMenuHoursByMenuHourIDs: (hourIDs: number[], repository?: EntityManager) => Promise<void>;
  hardDeleteMenuHoursByMenuID: (menuID: number, repository?: EntityManager) => Promise<void>;
  createMenuHours: (menuHours: MenuHours[], menuID: number, manager?: EntityManager) => Promise<MenuHoursDBInterface[]>;
  insertMenuHours?: (menuHours: MenuHours[], menuID: number, repository?: PostgresQueriesRepository) => Promise<MenuHoursDBInterface[]>;
  updateMenuHour: (menuHour: Partial<MenuHoursEntity>, manager?: EntityManager) => Promise<void>;
}

export interface MenuHours {
  day: string;
  start: string;
  end: string;
  createdAt?: string;
  updatedAt?: string;
  id?: number;
  menuID?: number;
}

export interface MenuHoursDBInterface {
  day: string;
  start: string;
  end: string;
  id: number;
  menu_id?: number;
  created_at?: string;
  updated_at?: string;
}
