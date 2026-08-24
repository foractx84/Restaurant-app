import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import { MediaType } from '@/enums/mediaType';
import { EntityManager } from 'typeorm';

export interface RestaurantProfileAlbumMediaServiceInterface {
  deleteGalleryImagesByIDs: (galleryImagesToDelete: number[], restaurantID: number, repository?: EntityManager) => Promise<void>;
  insertRestaurantProfileAlbumMedia: (
    restaurantProfileAlbumsMediaEntities: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ) => Promise<RestaurantProfileAlbumMediaEntity[]>;
  reorderGalleryImages: (restaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[], repository?: EntityManager) => Promise<void>;
  setupMediaListOrder: (
    albumID: number,
    images: string[],
    insertedFilesName: string,
    listOrder: string[],
    mediaInsertedResult: RestaurantProfileAlbumMediaEntity[],
  ) => RestaurantProfileAlbumMediaEntity[];
  validateGalleryImagesUploaded: (
    currentGalleryImages: number[],
    galleryImages: string[],
    galleryOrder: string[],
    galleryImagesToDelete: number[],
  ) => void;
}

export interface RestaurantProfileAlbumMediaModelInterface {
  deleteGalleryImagesByIDs: (galleryImagesToDelete: number[], restaurantID: number, repository?: EntityManager) => Promise<void>;
  insertRestaurantProfileAlbumMedia: (
    restaurantProfileAlbumsMediaEntities: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ) => Promise<RestaurantProfileAlbumMediaEntity[]>;
  reorderGalleryImages: (restaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[], repository?: EntityManager) => Promise<void>;
}

export interface RestaurantProfileAlbumMediaDBInterface {
  restaurant_profile_album_media_id?: number;
  restaurant_profile_album_id?: number;
  media_id?: number;
  list_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface RestaurantProfileAlbumMediaResponseInterface {
  mediaURL: string;
  mediaID: number; // AKA restaurant_profile_album_media_id
  type: MediaType;
  smallMobile: string;
  largeMobile: string;
  smallDesktop: string;
  largeDesktop: string;
  stream?: RestaurantProfileAlbumMediaVideoResponseInterface;
}

export interface RestaurantProfileAlbumMediaVideoResponseInterface {
  hls: string;
  dash: string;
}
