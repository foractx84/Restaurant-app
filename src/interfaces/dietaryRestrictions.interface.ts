import { NextFunction, Request, Response } from 'express';
import { DietaryRestrictionEntity } from '@/entities/dietaryRestriction.entity';
import { EntityManager } from 'typeorm';

export interface DietaryRestrictionsControllerInterface {
  getAllRestrictions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface DietaryRestrictionsModelInterface {
  findDietaryRestrictionsByIDs: (restrictionIDs: number[]) => Promise<DietaryRestrictionEntity[]>;
  getAllRestrictions: (repository?: EntityManager) => Promise<DietaryRestrictionEntity[]>;
}

export interface DietaryRestrictionsServiceInterface {
  validateDietaryRestrictions: (restrictionIDs: number[]) => Promise<void>;
  getAllRestrictions: () => Promise<DietaryRestrictionsInterface[]>;
}

export interface DietaryRestrictionsDBInterface {
  restriction_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DietaryRestrictionsInterface {
  restrictionID: number;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}
