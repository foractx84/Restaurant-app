import { LinkLongFormVideoToMediaLibraryDto } from '@/dtos/media.dto';
import { MediaEntity } from '@/entities/media.entity';
import { MediaType } from '@/enums/mediaType';
import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';

export interface MediaLibraryControllerInterface {
  createSignedURL: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkLongFormMediaToMediaLibrary: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  uploadMediaImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  uploadMediaVideos: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface MediaLibraryServiceInterface {
  createSignedURL: (extension: string) => Promise<CreateSignedURLResponse>;
  getMediaByMediaID: (mediaID: number) => Promise<MediaEntity>;
  getMediaByRestaurantID: (restaurantID: number) => Promise<MediaEntity[]>;
  insertImages: (images: Partial<MediaEntity>[], restaurantID: number, repository?: EntityManager) => Promise<MediaResponseInterface[]>;
  insertMedia: (media: MediaEntity[], repository?: EntityManager) => Promise<MediaEntity[]>;
  insertVideos: (videos: Partial<MediaEntity>[], restaurantID: number, repository?: EntityManager) => Promise<MediaResponseInterface[]>;
  softDeleteMediaByMediaID: (mediaID: number, entityManager?: EntityManager) => Promise<void>;
}

export interface MediaLibraryModelInterface {
  getMediaByMediaID: (mediaID: number) => Promise<MediaEntity>;
  getMediaByRestaurantID: (restaurantID: number, sortBy?: string, entityManager?: EntityManager) => Promise<MediaEntity[]>;
  getMediaByMediaURL: (mediaURL: string) => Promise<MediaEntity>;
  insertMedia: (media: MediaEntity[], repository?: EntityManager) => Promise<MediaEntity[]>;
  softDeleteMediaByMediaID: (mediaID: number, repository?: EntityManager) => Promise<void>;
}

export interface MediaLibraryDBInterface {
  media_id?: number;
  restaurant_id?: number;
  media_url: string;
  name?: string;
  description?: string;
  media_type_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface MediaResponseInterface {
  mediaID: number;
  mediaUrl: string;
  type?: MediaType.IMAGE | MediaType.VIDEO;
  createdAt?: string;
  name?: string;
}

export interface CreateSignedURLResponse {
  signedURL: string;
  fileName: string;
  videoUUID: string;
}
