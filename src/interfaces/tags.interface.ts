import { TagsEntity } from '@/entities/tags.entity';
import { Request, Response, NextFunction } from 'express';
import { EntityManager } from 'typeorm';

export interface TagsControllerInterface {
  getCustomTagsAndDefaultTagsByRestaurantID: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createRestaurantTag: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface TagsModelInterface {
  insertTag: (tagEntity: TagsEntity, repository?: EntityManager) => Promise<TagsDBInterface>;
  getTagByNameAndColorAndRestaurantID: (restaurantID: number, tagName: string, color: string, repository?: EntityManager) => Promise<TagsDBInterface>;
  getCustomTagsAndDefaultTagsByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<TagsDBInterface[]>;
}

export interface TagsServiceInterface {
  getCustomTagsAndDefaultTagsByRestaurantID: (restaurantID: number) => Promise<TagsInterface[]>;
  validateTagsByRestaurantID: (tagIDs: number[], restaurantID: number) => Promise<void>;
  createRestaurantTag: (tag: CreateTagRequestInterface, restaurantID: number) => Promise<CreateTagResponseInterface>;
}

export interface TagsDBInterface {
  tag_id?: number;
  name: string;
  color: string;
  restaurant_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TagsInterface {
  tagID?: number;
  name: string;
  tagColor: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTagRequestInterface {
  name: string;
  color?: string;
}

export interface CreateTagResponseInterface {
  tagID: number;
  name: string;
  color: string;
}
