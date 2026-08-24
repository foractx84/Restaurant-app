import { Request, Response, NextFunction } from 'express';
import { EntityManager } from 'typeorm';
import { CuisineEntity } from '@/entities/cuisine.entity';

export interface CuisinesControllerInterface {
  getAllCuisines: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface CuisinesServiceInterface {
  getAllCuisines: () => Promise<CuisineInterface[]>;
  checkIfCuisineExists: (cuisineID: number) => Promise<CuisineEntity>;
}

export interface CuisinesModelInterface {
  getAllCuisines: (repository?: EntityManager) => Promise<CuisineEntity[]>;
  getCuisineByID: (cuisineID: number, repository?: EntityManager) => Promise<CuisineEntity>;
}

export interface CuisineInterface {
  cuisineID: number;
  name: string;
}
