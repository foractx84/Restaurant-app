import { RestaurantProfileAlbumsEntity } from '@/entities/restaurantProfileAlbums.entity';
import { EntityManager } from 'typeorm';
import { RestaurantProfileAlbumMediaResponseInterface } from './restaurantProfileAlbumMedia.interface';
import { MediaEntity } from '@/entities/media.entity';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';

export interface RestaurantProfileAlbumsServiceInterface {
  deleteGalleryImagesByIDsForAlbum: (galleryImagesToDelete: number[], restaurantID: number, repository?: EntityManager) => Promise<void>;
  getRestaurantProfileAlbumsByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantProfileAlbumsEntity[]>;
  insertRestaurantProfileAlbums: (
    restaurantProfileAlbumsMediaEntities: RestaurantProfileAlbumsEntity[],
    repository?: EntityManager,
  ) => Promise<RestaurantProfileAlbumsEntity[]>;
  setupGalleryImagesListOrder: (
    albumID: number,
    galleryImages: string[],
    galleryOrder: string[],
    insertedRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ) => Promise<void>;
  setupInsertingAlbumAndGalleryImages: (
    galleryImages: string[],
    insertedAlbums: RestaurantProfileAlbumsEntity[],
    insertedMedia: MediaEntity[],
    restaurantID: number,
    insertedRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ) => Promise<void>;
  validateGalleryImageUploadAndFetchRestaurantAlbums: (
    galleryImages: string[],
    galleryImagesToDelete: number[],
    galleryOrder: string[],
    restaurantID: number,
  ) => Promise<RestaurantProfileAlbumsEntity[]>;
  validateGalleryImagesUploadedForAlbum: (
    currentGalleryImageIDs: number[],
    galleryImages: string[],
    galleryImagesToDelete: number[],
    galleryOrder: string[],
  ) => void;
}

export interface RestaurantProfileAlbumsModelInterface {
  getRestaurantProfileAlbumsByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantProfileAlbumsEntity[]>;
  insertRestaurantProfileAlbums: (
    restaurantProfileAlbumsMediaEntities: RestaurantProfileAlbumsEntity[],
    repository?: EntityManager,
  ) => Promise<RestaurantProfileAlbumsEntity[]>;
}

export interface RestaurantProfileAlbumsDBInterface {
  restaurant_profile_album_id?: number;
  restaurant_id?: number;
  name?: string;
  description?: string;
  list_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  is_hidden?: boolean;
}

export interface RestaurantProfileAlbumsResponseInterface {
  name: string;
  albumID: number;
  isHidden: boolean;
  media: RestaurantProfileAlbumMediaResponseInterface[];
}
