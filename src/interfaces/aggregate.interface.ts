import { MenuItemsRestrictionsEntity } from '@/entities/menuItemsRestrictions.entity';
import { MenuItemSizeEntity } from '@/entities/menuItemSize.entity';
import { EntityManager } from 'typeorm';
import { MenuItemsTagsEntity } from '@/entities/menuItemsTags.entity';
import { MenuItemPairingsEntity } from '@/entities/menuItemPairings.entity';
import { ModifierGroupToMenuItemLinkEntity } from '@/entities/modifierGroupToMenuItemLink.entity';

export interface AggregateServiceInterface {
  createMenuItemDietaryRestrictions: (menuItemID: number, dietaryRestrictionIDs: number[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemDietaryRestrictionsByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<void>;
  createMenuItemModifierGroups: (menuItemID: number, modifierGroupIDs: number[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemModifierGroupsByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<void>;
  createMenuItemPairings: (menuItemID: number, pairingItemIDs: number[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemPairingsByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<void>;
  createMenuItemSizes: (menuItemID: number, itemSizeIDs: number[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemSizesByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<void>;
  createMenuItemTagsByMenuItemID: (menuItemID: number, tagID: number[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemTagsByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<void>;
}

export interface AggregateModelInterface {
  insertMenuItemDietaryRestrictions: (menuItemsRestrictions: MenuItemsRestrictionsEntity[], repository: EntityManager) => Promise<void>;
  deleteMenuItemDietaryRestrictionsByMenuItemID: (menuItemID: number, repository: EntityManager) => Promise<void>;
  insertMenuItemPairings: (menuItemPairings: MenuItemPairingsEntity[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemPairingsByMenuItemID: (menuItemID: number, repository: EntityManager) => Promise<void>;
  insertMenuItemModifierGroups: (menuItemsModifierGroups: ModifierGroupToMenuItemLinkEntity[], repository?: EntityManager) => Promise<void>;
  deleteMenuItemModifierGroupsByMenuItemID: (menuItemID: number, repository: EntityManager) => Promise<void>;
  insertMenuItemSizes: (menuItemSizes: MenuItemSizeEntity[], repository: EntityManager) => Promise<void>;
  deleteMenuItemSizesByMenuItemID: (menuItemID: number, repository: EntityManager) => Promise<void>;
  deleteMenuItemTagsByMenuItemID: (menuItemID: number, repository: EntityManager) => Promise<void>;
  insertMenuItemTags: (menuItemsLinkTagsEntity: MenuItemsTagsEntity[], repository: EntityManager) => Promise<void>;
}

export interface MenuItemsAdditionsDBInterface {
  addition_id: number;
  menu_item_id: number;
}

export interface MenuItemsRestrictionsDBInterface {
  restriction_id: number;
  menu_item_id: number;
}

export interface MenuItemsSideDishesDBInterface {
  side_dish_id: number;
  menu_item_id: number;
}
