import { EntityManager } from 'typeorm';

export interface ItemSizeServiceInterface {
  createAllItemSizesForMenuItem: (menuItemID: number, allItemSizes: ItemSize[], repository?: EntityManager) => Promise<ItemSizeResponse[]>;
  createItemSizeType: (label: string, price: number, priceOverride: string, repository?: EntityManager) => Promise<ItemSizeResponse>;
  getBaseItemSizeFromAllItemSizes: (baseItemSizeID: number, allItemSizes: ItemSizeResponse[]) => ItemSizeResponse;
  getItemSizeTypeByLabelAndPriceAndPriceOverride: (
    label: string,
    price: number,
    priceOverride: string,
    repository?: EntityManager,
  ) => Promise<MenuItemSizeTypesDBInterface>;
}

export interface ItemSizeTypeModelInterface {
  getItemSizeType: (label: string, price: number, priceOverride: string, repository: EntityManager) => Promise<MenuItemSizeTypesDBInterface>;
  insertItemSizeType: (label: string, price: number, priceOverride: string, repository: EntityManager) => Promise<MenuItemSizeTypesDBInterface>;
}

export interface ItemSize {
  label: string;
  price: number;
  priceOverride: string;
}

export interface ItemSizeResponse {
  id: number;
  label: string;
  price: number;
  priceOverride: string;
}

export interface MenuItemSizeDBInterface {
  id?: number;
  menu_item_id: number;
  item_size_id: number;
}

export interface MenuItemSizeTypesDBInterface {
  id: number;
  label: string;
  price: number;
  price_override: string;
}
