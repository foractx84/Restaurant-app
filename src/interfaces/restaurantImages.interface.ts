import { RestaurantImageEntity } from '@/entities/restaurantImage.entity';
import { EntityManager } from 'typeorm';
import { RestaurantImageType } from '@/enums/restaurantImageType';
import { RestaurantProfileAlbumsResponseInterface } from './restaurantProfileAlbums.interface';
import { MediaEntity } from '@/entities/media.entity';

export interface RestaurantImagesServiceInterface {
  getRestaurantImagesByRestaurantID: (restaurantID: number) => Promise<RestaurantImageInterface[]>;
  insertRestaurantImages: (images: RestaurantImageEntity[], repository?: EntityManager) => Promise<RestaurantImageEntity[]>;
  deleteImages: (imageIDs: number[], restaurantID: number, repository?: EntityManager) => Promise<void>;
  setupInsertingRestaurantImages: (images: RestaurantImageEntity[], mediaLibrary: MediaEntity[], repository?: EntityManager) => any;
  setupRestaurantAndMediaLibraryImages: (
    logoImage: string,
    menuCoverImage: string,
    profileImages: string[],
    restaurantID: number,
    thumbnailImage: string,
  ) => Promise<any>;
  validateRestaurantImages: (
    imagesToDelete: number[],
    logoImage: string,
    menuCoverImage: string,
    profileImages: string[],
    restaurantID: number,
    thumbnailImage: string,
  ) => Promise<void>;
  validateImagesToDelete: (existingImageIDs: number[], idsToDelete: number[]) => void;
  validateRestaurantImagesByType: (
    restaurantImages: RestaurantImageInterface[],
    imagesToBeDeleted: number[],
    types: RestaurantImageType[],
    possibleImagesBeingUploaded: any,
  ) => void;
}

export interface RestaurantImagesModelInterface {
  findRestaurantImageEntitiesByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<RestaurantImageEntity[]>;
  insertImages: (restaurantImages: RestaurantImageEntity[], repository?: EntityManager) => Promise<RestaurantImageEntity[]>;
  softDeleteRestaurantImages: (imageIDs: number[], restaurantID: number, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantImageResponseInterface {
  imageID: number;
  imageURL: string;
}

export interface RestaurantImageInterface extends RestaurantImageResponseInterface {
  restaurantID: number;
  restaurantImageType: string;
  listOrder?: number;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadRestaurantImagesRequestInterface {
  imagesToDelete: string;
  galleryImagesToDelete: string;
  galleryOrder: string;
}

export interface RestaurantImagesInterface {
  logo?: RestaurantImageResponseInterface;
  profile?: RestaurantImageResponseInterface;
  thumbnail?: RestaurantImageResponseInterface;
  menuCover?: RestaurantImageResponseInterface;
  albums?: RestaurantProfileAlbumsResponseInterface[];
}

export interface RestaurantImageDetailsInterface {
  logo?: RestaurantImageResponseInterface;
  profile?: RestaurantImageResponseInterface[];
  thumbnail?: RestaurantImageResponseInterface;
  menuCover?: RestaurantImageResponseInterface;
  albums?: RestaurantProfileAlbumsResponseInterface[];
}
