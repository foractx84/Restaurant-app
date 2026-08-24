import { NextFunction, Request, Response } from 'express';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ModifierEntity } from '@/entities/modifier.entity';
import { EntityManager } from 'typeorm';
import { GetMenuDetailsModifierMediaResponseInterface } from './modifierMedia.interface';

export interface ModifierControllerInterface {
  createModifier: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editModifier: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteModifier: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getModifiers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface ModifierServiceInterface {
  createModifier: (modifier: CreateModifierRequestInterface, restaurantID: number, manager?: EntityManager) => Promise<ModifierResponse>;
  editModifier: (editModifierRequest: EditModifierRequestInterface, modifier: ModifierEntity, manager?: EntityManager) => Promise<void>;
  softDeleteModifier: (modifier: ModifierEntity, manager?: EntityManager) => Promise<void>;
  softDeleteModifierByExternalID: (externalID: string, manager?: EntityManager) => Promise<void>;
  getModifiers: (restaurantID: number) => Promise<ModifierResponse[]>;
  getModifierByExternalID: (externalID: string, manager?: EntityManager) => Promise<ModifierEntity>;
}

export interface ModifierModelInterface {
  fetchModifierByID: (modifierID: number, entityManager?: EntityManager) => Promise<ModifierEntity>;
  fetchModifierByExternalID: (externalID: string, entityManager?: EntityManager) => Promise<ModifierEntity>;
  findModifiersByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<ModifierEntity[]>;
  softDeleteModifier: (modifierID: number, entityManager?: EntityManager) => Promise<void>;
  upsertModifier: (modifier: ModifierEntity, entityManager?: EntityManager) => Promise<ModifierEntity>;
}

export interface CreateModifierRequestInterface {
  name: string;
  description?: string;
  price?: number;
  externalID?: string;
  isHidden?: boolean;
}

export interface EditModifierRequestInterface {
  modifierID: number;
  name?: string;
  description?: string;
  price?: number;
  isHidden?: boolean;
}

export interface ModifierResponse {
  modifierID: number;
  name: string;
  description: string;
  price: number;
  isHidden?: boolean;
  imageURL?: string;
}

export interface ModifierInterface {
  modifierID?: number;
  name: string;
  description?: string;
  price?: number;
  restaurantID?: number;
  external_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  isHidden?: boolean;
  restaurant?: RestaurantEntity;
}

export interface GetMenuDetailsModifiersResponseInterface {
  modifierID?: number;
  name: string;
  description?: string;
  price?: number;
  isHidden: boolean;
  listOrder: number;
  media: GetMenuDetailsModifierMediaResponseInterface[];
  externalID?: string;
}

export interface DeleteModifierRequestInterface {
  modifierID: number;
}
