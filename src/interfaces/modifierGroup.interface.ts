import { NextFunction, Request, Response } from 'express';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { EntityManager } from 'typeorm';
import { ModifierEntity } from '@/entities/modifier.entity';
import { GetMenuDetailsModifiersResponseInterface, ModifierResponse } from './modifier.interface';

export interface ModifierGroupControllerInterface {
  createModifierGroup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteModifierGroup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editModifierGroup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getModifierGroups: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkModifiersToModifierGroup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface ModifierGroupServiceInterface {
  createModifierGroup: (
    modifierGroup: CreateModifierGroupRequestInterface,
    restaurantID: number,
    platformIntegrationOverride?: boolean,
    manager?: EntityManager,
  ) => Promise<CreateModifierGroupResponseInterface>;
  editModifierGroup: (
    modifierGroupRequest: EditModifierGroupRequestInterface,
    modifierGroup: ModifierGroupEntity,
    platformIntegrationOverride?: boolean,
    manager?: EntityManager,
  ) => Promise<void>;
  fetchModifierGroupByNameAndRestaurantID: (name: string, restaurantID: number) => Promise<ModifierGroupEntity>;
  getModifierGroupByExternalID: (externalID: string, manager?: EntityManager) => Promise<ModifierGroupEntity>;
  getModifierGroups: (restaurantID: number) => Promise<GetModifierGroupResponseInterface[]>;
  linkModifiersToModifierGroup: (linkRequest: LinkModifiersToModifierGroupRequestInterface, manager?: EntityManager) => Promise<void>;
  softDeleteModifierGroup: (modifierGroup: ModifierGroupEntity, manager?: EntityManager) => Promise<void>;
}

export interface ModifierGroupModelInterface {
  createModifierGroup: (modifierGroup: ModifierGroupEntity, entityManager?: EntityManager) => Promise<ModifierGroupEntity>;
  fetchModifierGroupByID: (modifierGroupID: number, entityManager?: EntityManager) => Promise<ModifierGroupEntity>;
  fetchModifierGroupByExternalID: (externalID: string, entityManager?: EntityManager) => Promise<ModifierGroupEntity>;
  fetchModifierGroupByNameAndRestaurantID: (name: string, restaurantID: number) => Promise<ModifierGroupEntity>;
  fetchModifierGroupsByRestaurantID: (restaurantID: number) => Promise<ModifierGroupEntity[]>;
  softDeleteModifierGroup: (modifierGroupID: number, entityManager?: EntityManager) => Promise<void>;
  upsertModifierGroup: (modifierGroup: ModifierGroupEntity, entityManager?: EntityManager) => Promise<ModifierGroupEntity>;
}

export interface ModifierGroupInterface {
  modifierGroupID?: number;
  label?: string;
  name?: string;
  restaurantID?: number;
  external_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  isHidden?: boolean;
  minimumSelections?: number | null;
  maximumSelections?: number | null;
  maxPerModifierSelectionQuantity?: number | null;
}

export interface CreateModifierGroupRequestInterface {
  name: string;
  label: string;
  modifierIDs: number[];
  externalID?: string;
  minimumSelections?: number | null;
  maximumSelections?: number | null;
  maxPerModifierSelectionQuantity?: number | null;
}

export interface CreateModifierGroupResponseInterface {
  name: string;
  modifierGroupID: number;
  label: string;
  modifiers?: ModifierEntity[];
  minimumSelections?: number | null;
  maximumSelections?: number | null;
  maxPerModifierSelectionQuantity?: number | null;
}

export interface DeleteModifierGroupRequestInterface {
  modifierGroupID: number;
}

export interface EditModifierGroupRequestInterface {
  modifierGroupID: number;
  name?: string;
  label?: string;
  minimumSelections?: number | null;
  maximumSelections?: number | null;
  maxPerModifierSelectionQuantity?: number | null;
}

export interface LinkModifiersToModifierGroupRequestInterface {
  modifierGroupID: number;
  modifierIDs: number[];
}

export interface GetModifierGroupResponseInterface {
  name: string;
  modifierGroupID: number;
  label: string;
  modifiers?: ModifierResponse[];
  minimumSelections?: number | null;
  maximumSelections?: number | null;
  maxPerModifierSelectionQuantity?: number | null;
}

export interface GetMenuDetailsModifierGroupsResponseInterface {
  name: string;
  modifierGroupID: number;
  label: string;
  listOrder: number;
  modifiers?: GetMenuDetailsModifiersResponseInterface[];
  minimumSelections?: number | null;
  maximumSelections?: number | null;
  maxPerModifierSelectionQuantity?: number | null;
  externalID?: string;
}
