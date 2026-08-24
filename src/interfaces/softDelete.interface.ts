import { EntityManager } from 'typeorm';

export interface SoftDeleteServiceInterface {
  softDeleteMenuByID: (menuID: number, repository?: EntityManager) => Promise<void>;
  softDeleteMenuItemByMenuID: (menuID: number, repository: EntityManager) => Promise<void>;
  softDeleteMenuItemByMenuSectionID: (menuSectionID: number, repository: EntityManager) => Promise<void>;
  softDeleteMenuSectionByID: (menuSectionID: number, repository?: EntityManager) => Promise<void>;
  softDeleteMenuSectionByMenuID: (menuID: number, repository: EntityManager) => Promise<void>;
}
export interface SoftDeleteModelInterface {
  softDeleteMenuByID: (menuID: number, repository: EntityManager) => Promise<void>;
  softDeleteMenuItemByMenuID: (menuID: number, repository: EntityManager) => Promise<void>;
  softDeleteMenuItemByMenuSectionID: (menuSectionID: number, repository: EntityManager) => Promise<void>;
  softDeleteMenuSectionByID: (menuSectionID: number, repository?: EntityManager) => Promise<void>;
  softDeleteMenuSectionByMenuID: (menuID: number, repository: EntityManager) => Promise<void>;
}
