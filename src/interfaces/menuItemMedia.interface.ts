import { MenuItemMediaEntity } from '@/entities/menuItemMedia.entity';
import { MenuItemVideoThumbnailEntity } from '@/entities/menuItemVideoThumbnails.entity';
import { EntityManager } from 'typeorm';
import { MenuItemVideoThumbnailResponseInterface } from './menuItemVideoThumbnail.interface';
import { MediaEntity } from '@/entities/media.entity';

export interface MenuItemMediaServiceInterface {
  getMenuItemMediaByMenuItemID: (menuItemID: number, entityManager?: EntityManager) => Promise<MenuItemMediaEntity[]>;
  insertMenuItemMedia: (menuItemID: number, media: MediaEntity[], entityManager?: EntityManager) => Promise<MenuItemMediaEntity[]>;
  linkThumbnailsToMenuItem: (aggregateThumbnails: MenuItemVideoThumbnailEntity[], menuItemID: number, entityManager?: EntityManager) => Promise<void>;
  softDeleteThumbnailsByIDs: (thumbnailIDs: number[], entityManager?: EntityManager) => Promise<void>;
  softDeleteMenuItemMediaByIDs: (mediaIDs: number[], menuItemID: number, entityManager?: EntityManager) => Promise<void>;
  uploadMenuItemMedia: (
    images: string[],
    imagesToDelete: number[],
    menuItemID: number,
    listOrder: string[],
    thumbnail?: string,
    thumbnailExistingID?: number,
    video?: string,
    videoExistingID?: number,
    videoExistiingURL?: string,
  ) => Promise<MenuItemMediaEntity[]>;
  validateIDsIncluded: (existingImageIDs: number[], imagesToDelete: number[]) => void;
}

export interface MenuItemMediaModelInterface {
  deleteMenuItemMedia: (imagesToDelete: number[], repository?: EntityManager) => Promise<void>;
  getMenuItemMediaByMenuItemID: (menuItemID: number, repository?: EntityManager) => Promise<MenuItemMediaEntity[]>;
  insertMenuItemMedia: (
    menuItemMedia: MenuItemMediaDBInterface[] | MenuItemMediaEntity[],
    repository?: EntityManager,
  ) => Promise<MenuItemMediaEntity[]>;
  reorderMenuItemMediaImages: (updatedListOrder: MenuItemMediaDBInterface[], repository?: EntityManager) => Promise<void>;
  softDeleteMenuItemMediaByIDs: (mediaIDs: number[], menuItemID: number, repository?: EntityManager) => Promise<void>;
  updateImageUrlForMenuItem: (menuItemID: number, repository?: EntityManager) => Promise<void>;
}

export interface MenuItemMediaDBInterface {
  menu_item_media_id?: number;
  menu_item_id?: number;
  media_url?: string;
  menu_item_media_type_id?: number;
  list_order?: number;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  menu_item_video_thumbnail?: MenuItemVideoThumbnailEntity;
}

export interface MenuItemMediaResponseInterface {
  mediaID: number;
  mediaURL: string;
  thumbnail?: MenuItemVideoThumbnailResponseInterface | {};
  type: 'image' | 'video';
  listOrder?: number;
}

export interface LinkMenuItemAndMediaAndThumbnailsInterface {
  videoID: number;
  thumbnailID: number;
}

export interface LinkMenuItemAndMediaInterface {
  menuItemID: number;
  mediaIDs: number[];
  thumbnails: LinkMenuItemAndMediaAndThumbnailsInterface[];
}
