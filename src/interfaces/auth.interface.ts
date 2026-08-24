import { SpecialUserEntity } from '@/entities/special_user.entity';
import { NextFunction, Request, Response } from 'express';
import { UserDBInterface, UserInterface } from './users.interface';

export interface AuthControllerInterface {
  authenticateLogin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface AuthServiceInterface {
  authenticateLogin: (user: UserInterface) => Promise<TokenDataInterface>;
  validateManager: (managerID: number, restaurantID: number) => Promise<boolean>;
  validateSuperUser: (id: number) => Promise<boolean>;
}

export interface AuthModelsInterface {
  getManager: (email: string) => Promise<UserDBInterface>;
  getSuperUser: (email: string) => Promise<SpecialUserEntity>;
  validateManagerAuthorized: (managerID: number, restaurantID: number) => Promise<boolean>;
  findSuperUserByID: (id: number) => Promise<SpecialUserEntity>;
}

export interface TokenDataInterface {
  token: string;
  hasPairings: boolean;
  hasImageUpload: boolean;
}

export interface ResetPasswordInterface {
  email: string;
  tempPassword: string;
  newPassword: string;
}

export interface ForgetPasswordInterface {
  email: string;
}
