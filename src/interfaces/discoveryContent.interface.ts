import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { RestaurantEntity } from '@entities/restaurant.entity';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import { CreateDiscoveryContentDto, EditDiscoveryContentDto } from '@/dtos/discoveryContent.dto';
import { GetContentReservationOrderingInterface } from './discoveryContentURLs.interface';
import { MediaResponseInterface } from './mediaLibrary.interface';
import { GetContentMetaTags } from './discoveryContentMetaTags.interface';
import { GetContentCategoryBuckets } from './discoveryContentCategoryBuckets.interface';

export interface DiscoveryContentControllerInterface {
  createDiscoveryContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteDiscoveryContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editDiscoveryContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getDiscoveryContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  hideDiscoveryContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface DiscoveryContentServiceInterface {
  createDiscoveryContent: (discoveryContent: CreateDiscoveryContentDto, restaurantID: number) => Promise<GetDiscoveryResponseInterface>;
  getDiscoveryContent: (restaurantID: number) => Promise<GetDiscoveryResponseInterface[]>;
  hideDiscoveryContent: (discoveryContent: DiscoveryContentEntity, hide: boolean) => Promise<void>;
  softDeleteDiscoveryContent: (discoveryContent: DiscoveryContentEntity) => Promise<void>;
  editDiscoveryContent: (
    currentDiscoveryContent: DiscoveryContentEntity,
    discoveryContentRequest: EditDiscoveryContentDto,
    restaurantID: number,
  ) => Promise<void>;
}

export interface DiscoveryContentModelInterface {
  fetchDiscoveryContentByID: (discoveryContentID: number, entityManager?: EntityManager) => Promise<DiscoveryContentEntity>;
  getDiscoveryContentByRestaurantID: (restaurantID: number) => Promise<DiscoveryContentEntity[]>;
  softDeleteDiscoveryContent: (discoveryContentID: number, entityManager?: EntityManager) => Promise<void>;
  upsertDiscoveryContent: (discoveryContent: DiscoveryContentEntity, entityManager?: EntityManager) => Promise<DiscoveryContentEntity>;
}

export interface DiscoveryContentInterface {
  discoveryContentID?: number;
  title: string;
  description?: string;
  restaurantID?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  isHidden?: boolean;
  restaurant?: RestaurantEntity;
}

export interface DeleteDiscoveryContentRequestInterface {
  discoveryContentID: number;
}

export interface HideDiscoveryContentRequest {
  discoveryContentID: number;
  hide: boolean;
}

export interface GetDiscoveryResponseInterface {
  discoveryContentID?: number;
  title?: string;
  description?: string;
  urls: GetContentReservationOrderingInterface[];
  media: MediaResponseInterface[];
  metaTags: GetContentMetaTags[];
  categories: GetContentCategoryBuckets[];
}
