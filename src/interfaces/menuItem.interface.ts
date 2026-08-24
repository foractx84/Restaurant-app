import { ItemSizeResponse } from '@/interfaces/itemSize.interface';
import { CreateItemSizeDto } from '@dtos/itemSize.dto';
import { NextFunction, Request, Response } from 'express';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { EntityManager } from 'typeorm';
import { DietaryRestrictionsInterface } from './dietaryRestrictions.interface';
import { TagsInterface } from './tags.interface';
import { GetDrinkItemsInterface } from '@interfaces/drinkItem.interface';
import { LinkMenuItemAndMediaInterface, MenuItemMediaResponseInterface } from './menuItemMedia.interface';
import { GetMenuDetailsModifierGroupsResponseInterface } from './modifierGroup.interface';
import { MediaEntity } from '@/entities/media.entity';

export interface MenuItemControllerInterface {
  createMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  hideMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkDrinkItemsToMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkMediaToMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkModifierGroupsToMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkRestrictionsToMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkTagToMenuItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reorderMenuItems: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  uploadMenuItemMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface MenuItemServiceInterface {
  createMenuItem: (menuItem: CreateMenuItemRequestInterface, manager?: EntityManager) => Promise<CreateMenuItemResponse>;
  deleteMenuItemByID: (menuItemID: number, manager?: EntityManager) => Promise<void>;
  editMenuItem: (menuItem: EditMenuItemRequestInterface, manager?: EntityManager) => Promise<void>;
  hideMenuItem: (menuItemID: number, hide: boolean) => Promise<void>;
  linkDrinkItemsToMenuItem: (menuItemID: number, pairingItemIDs: number[], restaurantID: number) => Promise<void>;
  linkMediaToMenuItem: (media: MediaEntity[], linkRequest: LinkMenuItemAndMediaInterface, manager?: EntityManager) => Promise<void>;
  linkModifierGroupsToMenuItem: (menuItemID: number, modifierGroupIDs: number[], restaurantID: number, manager?: EntityManager) => Promise<void>;
  linkRestrictionsToMenuItem: (menuItemID: number, dietaryRestrictionIDs: number[]) => Promise<void>;
  linkTagToMenuItem: (menuItemID: number, tagID: number[], restaurantID: number) => Promise<void>;
  softDeleteMenuItemByID: (menuItemID: number, manager?: EntityManager) => Promise<void>;
  getMenuItemsByMenuSection: (menuSectionID: number, isPrixFixe?: boolean, includeHidden?: boolean) => Promise<GetMenuItemsByMenuSectionInterface[]>;
  getMenuItemByExternalID: (externalID: string, manager?: EntityManager) => Promise<MenuItemEntity>;
  reorderMenuItems: (menuSectionID: number, menuItemsOrder: number[], manager?: EntityManager) => Promise<void>;
  uploadMenuItemMedia: (
    images: string[],
    menuItemID: number,
    mediaOrder: string[],
    mediaToDelete: number[],
    thumbnail?: string,
    video?: string,
  ) => Promise<UploadMulipleMenuItemMediaResponseInterface>;
}

export interface MenuItemModelInterface {
  deleteMenuItemByID: (menuItemID: number, manager?: EntityManager) => Promise<void>;
  findMenuItemByIDAndRestaurantID: (menuItemID: number, restaurantID: number) => Promise<MenuItemEntity>;
  getLargestListOrderInMenuSection: (menuSectionID: number) => Promise<number>;
  getMenuItemEntityByID: (menuItemID: number, manager?: EntityManager) => Promise<MenuItemEntity>;
  getMenuItemByExternalID: (externalID: string, manager?: EntityManager) => Promise<MenuItemEntity>;
  getMenuItemEntityWithMediaByID: (menuItemID: number) => Promise<MenuItemEntity>;
  getMenuItemsByMenuSection: (menuSectionID: number, includeHidden?: boolean) => Promise<GetMenuItemsByMenuSectionDBInterface>;
  getMenuItemsEntitiesByMenuSectionID: (menuSectionID: number, manager?: EntityManager) => Promise<MenuItemEntity[]>;
  getMenuItemsOfMenuSectionByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<MenuItemEntity[]>;
  hideMenuItem: (menuItemID: number, hide: boolean, respository?: EntityManager) => Promise<void>;
  insertMenuItem: (menuItem: MenuItemEntity, manager?: EntityManager) => Promise<MenuItemDBInterface>;
  softDeleteMenuItemByID: (menuItemID: number, manager?: EntityManager) => Promise<void>;
  updateMenuItem: (menuItem: MenuItemEntity, repository?: EntityManager) => Promise<void>;
  patchMenuItem: (menuItemID: number, fields: Partial<MenuItemEntity>, repository?: EntityManager) => Promise<void>;
  updateMenuItemsListOrder: (items: ReorderMenuItemsQueryInterface[], repository?: EntityManager) => Promise<void>;
}

export interface CreateMenuItemRequestInterface {
  name: string;
  description: string;
  menuSectionID: number;
  baseItemSize: CreateItemSizeDto;
  allItemSizes: CreateItemSizeDto[];
  category: string;
  calories?: number;
  externalID?: string;
  isFeatured?: boolean;
  isHidden?: boolean;
}

export interface CreateMenuItemRestrictionsRequestInterface {
  menuItemID: number;
  dietaryRestrictionIDs: number[];
}

export interface LinkMenuItemAndModifierGroupsRequestInterface {
  menuItemID: number;
  modifierGroupIDs: number[];
}

export interface DeleteMenuItemRequestInterface {
  menuItemID: number;
}

export interface EditMenuItemRequestInterface {
  menuItemID: number;
  menuSectionID?: number;
  name?: string;
  description?: string;
  baseItemSize?: CreateItemSizeDto;
  allItemSizes?: CreateItemSizeDto[];
  category?: string;
  listOrder?: number;
  calories?: number | null;
  isFeatured?: boolean;
  isHidden?: boolean;
}

export interface CreateMenuItemResponse {
  menuItemID: number;
  name: string;
  description: string;
  calories: number | null;
  category: string;
  menuSectionID: number;
  menuItemUrlID: string;
  baseItemSize: ItemSizeResponse;
  allItemSizes: ItemSizeResponse[];
  createdAt: string;
  isHidden?: boolean;
  isFeatured?: boolean;
}

export interface GetMenuDetailsMenuItemsResponseDatabaseInterface extends MenusItemsInterface {
  allItemSizes: ItemSizeResponse[];
  baseItemSize: ItemSizeResponse;
  dietaryRestrictions?: DietaryRestrictionsInterface[];
  tags?: TagsInterface[];
  pairings?: GetDrinkItemsInterface[];
  media: MenuItemMediaResponseInterface[];
  modifierGroups: GetMenuDetailsModifierGroupsResponseInterface[];
  baseItemSizeID: number;
  description: string;
  menuItemID: number;
  externalID?: string;
}

export interface GetMenuItemsByMenuSectionDBInterface {
  menuItems: GetMenuDetailsMenuItemsResponseDatabaseInterface[];
}

export interface GetMenuItemsByMenuSectionInterface extends MenusItemsInterface {
  menuItemID: number;
  allItemSizes: ItemSizeResponse[];
  baseItemSize: ItemSizeResponse;
  dietaryRestrictions?: DietaryRestrictionsInterface[];
  tags?: TagsInterface[];
  media: MenuItemMediaResponseInterface[];
  modifierGroups?: GetMenuDetailsModifierGroupsResponseInterface[];
  baseItemSizeID?: number;
  externalID?: string;
}

export interface MenuItemDBInterface {
  menu_item_id: number;
  menu_item_url_id: string;
  name: string;
  description: string;
  image_url: string;
  calories?: number;
  category: string;
  menu_section_id: number;
  list_order: number;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  base_item_size_id: number;
  is_hidden?: boolean;
  is_featured?: boolean;
  external_id?: string;
}

export interface MenusItemsInterface {
  name: string;
  category: string;
  calories: number;
  imageUrl: string;
  menuItemId: number;
  menuSectionId: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  listOrder: number;
  deleted: boolean;
  baseItemSizeId: number;
  menuItemUrlId: string;
  isHidden: boolean;
  isFeatured: boolean;
}

export interface HideMenuItemRequestInterface {
  menuItemID: number;
  hide: boolean;
}

export interface PairMenuItemRequestInterface {
  menuItemID: number;
  pairingItemIDs: number[];
}

export interface ReorderMenuItemsRequestInterface {
  menuSectionID: number;
  menuItemsOrder: number[];
}

export interface TagMenuItemsRequestInterface {
  menuItemID: number;
  tagIDs: number[];
}

export interface ReorderMenuItemsQueryInterface {
  menu_item_id: number;
  list_order: number;
}

export interface UploadMultipleMenuItemMediaRequestInterface {
  mediaOrder: string;
  menuItemID: number;
  mediaToRemove: string;
}

export interface UploadMulipleMenuItemMediaResponseInterface {
  media: MenuItemMediaResponseInterface[];
}
