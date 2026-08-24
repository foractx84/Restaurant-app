import { MenuItemVideoThumbnailEntity } from '@/entities/menuItemVideoThumbnails.entity';
import { EntityManager } from 'typeorm';

export interface MenuItemVideoThumbnailsServiceInterface {
  insertMenuItemVideoThumbnails: (
    menuItemVideoThumbnails: MenuItemVideoThumbnailEntity[],
    repository?: EntityManager,
  ) => Promise<MenuItemVideoThumbnailEntity[]>;
  softDeleteMenuItemVideoThumbnail: (thumbnailID: number, repository?: EntityManager) => Promise<MenuItemVideoThumbnailEntity>;
}

export interface MenuItemVideoThumbnailsModelInterface {
  insertMenuItemVideoThumbnails: (
    menuItemVideoThumbnails: MenuItemVideoThumbnailEntity[],
    repository?: EntityManager,
  ) => Promise<MenuItemVideoThumbnailEntity[]>;
  softDeleteMenuItemVideoThumbnail: (thumbnailID: number, repository?: EntityManager) => Promise<MenuItemVideoThumbnailEntity>;
}

export interface MenuItemVideoThumbnailsDBInterface {
  menu_item_video_thumbnail_id?: number;
  thumbnail_url?: string;
  menu_item_media_id?: number;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemVideoThumbnailResponseInterface {
  thumbnailID: number;
  thumbnailURL: string;
}
