import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { EventMediaEntity } from '@/entities/eventMedia.entity';

export type EventMediaType = 'image' | 'video';

export interface EventMediaDBInterface {
  event_media_id?: number;
  restaurant_id: number;
  media_url: string;
  media_type: EventMediaType;
  list_order: number;
  alt_text?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface EventMediaResponseInterface {
  eventMediaID: number;
  mediaUrl: string;
  mediaType: EventMediaType;
  listOrder: number;
  altText: string | null;
}

export interface EventMediaInsertInterface {
  mediaUrl: string;
  mediaType: EventMediaType;
  altText?: string | null;
}

export interface ReorderEventMediaItemInterface {
  eventMediaID: number;
  listOrder: number;
}

export interface ReorderEventMediaBodyInterface {
  items: ReorderEventMediaItemInterface[];
}

export interface EventMediaIdParamInterface {
  eventMediaID: number;
}

export interface EventMediaControllerInterface {
  listEventMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  uploadEventMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reorderEventMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteEventMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface EventMediaServiceInterface {
  listEventMedia: (restaurantID: number) => Promise<EventMediaResponseInterface[]>;
  insertEventMedia: (restaurantID: number, items: EventMediaInsertInterface[]) => Promise<EventMediaResponseInterface[]>;
  reorderEventMedia: (restaurantID: number, items: ReorderEventMediaItemInterface[]) => Promise<void>;
  deleteEventMedia: (eventMediaID: number, restaurantID: number) => Promise<void>;
}

export interface EventMediaModelInterface {
  fetchByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<EventMediaEntity[]>;
  fetchByID: (eventMediaID: number, restaurantID: number, repository?: EntityManager) => Promise<EventMediaEntity | undefined>;
  fetchMaxListOrder: (restaurantID: number, repository?: EntityManager) => Promise<number>;
  insertMany: (
    restaurantID: number,
    items: EventMediaInsertInterface[],
    startingOrder: number,
    repository?: EntityManager,
  ) => Promise<EventMediaEntity[]>;
  setListOrder: (eventMediaID: number, restaurantID: number, listOrder: number, repository?: EntityManager) => Promise<void>;
  softDelete: (eventMediaID: number, restaurantID: number, repository?: EntityManager) => Promise<EventMediaEntity | undefined>;
  countByRestaurantAndType: (restaurantID: number, mediaType: EventMediaType, repository?: EntityManager) => Promise<number>;
}
