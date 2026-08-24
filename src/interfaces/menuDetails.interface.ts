import { NormalizedMenu, NormalizedMenuItem, NormalizedModifierGroup } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';

export interface MenuDetailsServiceInterface {
  createMenusDetailsFromNormalized: (
    menu: NormalizedMenu[],
    restaurantID: number,
    locationID: number | null,
    manager?: EntityManager,
  ) => Promise<void>;
  createDetailsForMenuItem: (images: { link: string }[], itemID: number, restaurantID: number, manager?: EntityManager) => Promise<void>;
  createDetailsForMenuSection: (items: NormalizedMenuItem[], sectionID: number, restaurantID: number, manager?: EntityManager) => Promise<void>;
  createDetailsForModifierGroup: (
    modifierGroups: NormalizedModifierGroup[],
    itemID: number,
    restaurantID: number,
    existingModifierGroupIDs: number[],
    manager?: EntityManager,
  ) => Promise<void>;
}
