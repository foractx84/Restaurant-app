import { ManagerEntity } from '@/entities/manager.entity';
import { NextFunction, Request, Response } from 'express';
import { TitlesDBInterface } from './titles.interface';
import { EntityManager } from 'typeorm';
import { TokenDataInterface } from './auth.interface';

export interface ManagersControllerInterface {
  createManager: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  forgotPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getManager: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  resendEmail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  signupManager: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updatePassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  verifyManager: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editManagerInfoByID: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface ManagersServiceInterface {
  createManager: (manager: CreateManagerInterface) => Promise<void>;
  createManagerEntity: (manager: ManagerEntity, repository?: EntityManager) => Promise<ManagerEntity>;
  forgotPassword: (email: string) => Promise<void>;
  getManager: (managerID: number) => Promise<GetManagerInterface>;
  getManagerByStripeCustomerIDOrEmail: (stripeCustomerID: string, email: string) => Promise<ManagerEntity>;
  resetPassword: (email: string, tempPassword: string, newPassword: string) => Promise<TokenDataInterface>;
  resendEmail: (email: string) => Promise<void>;
  signupManager: (manager: CreateManagerInterface) => Promise<string>;
  updateManagerEntity: (manager: ManagerEntity, repository?: EntityManager) => Promise<void>;
  updatePassword: (managerID: number, currentPassword: string, newPassword: string) => Promise<void>;
  verifyManager: (managerID: number, verificationCode: string) => Promise<TokenDataInterface>;
  editManagerInfoByID: (managerID: number, stripeCustomerID: string, editManagerInfo: ManagerEditInfoRequestInterface) => Promise<void>;
}

export interface ManagersModelsInterface {
  createManager: (manager: CreateManagerInterface, repository?: EntityManager) => Promise<CreateManagerDBInterface>;
  createManagerEntity: (manager: ManagerDBInterface, repository?: EntityManager) => Promise<ManagerEntity>;
  createManagerToRestaurantLink: (managerToRestaurantLink: CreateManagerToRestaurantLinkInterface) => Promise<void>;
  getManagerAndTitleByID: (managerID: number, repository?: EntityManager) => Promise<ManagerEntity>;
  getManagerEntityByEmail: (email: string, repository?: EntityManager) => Promise<ManagerEntity>;
  getManagerEntityByID: (managerID: number, repository?: EntityManager) => Promise<ManagerEntity>;
  getManagerByStripeCustomerIDOrEmail: (stripeCustomerID: string, email: string, repository?: EntityManager) => Promise<ManagerEntity>;
  updateManagerEmailCode: (managerID: number, hashedEmailCode: string, respository?: EntityManager) => Promise<void>;
  updateManagerPasswordByID: (managerID: number, tempPassword: string, respository?: EntityManager) => Promise<void>;
  setVerifiedAtAndResetEmailCode: (managerID: number, repository?: EntityManager) => Promise<void>;
  updateManagerInfoByID: (managerInfo: ManagerEntity, repository?: EntityManager) => Promise<void>;
}

export interface CreateManagerInterface {
  // DB params
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pwd: string;
  stripeCustomerID?: string;
  titleID?: number; // not needed for request but can be helpful to store the id once position is found or created.
  titleName?: string; // not needed for db params but can be enforced in DTO
  restaurantIDs?: number[]; // not needed for db params but can be enforced in DTO
  emailCode?: string;
}
export interface CreateManagerDBInterface {
  // db results
  id: number;
}
export interface CreateManagerToRestaurantLinkInterface {
  // db params
  externalUserID: number;
  restaurantID: number;
}

export interface ManagerDBInterface {
  id?: number;
  first_name?: string;
  last_name?: string;
  email: string;
  email_code?: string;
  phone?: string;
  date_created?: string;
  updated_at?: string;
  pwd?: string;
  position_title_id?: number;
  stripe_customer_id?: string;
}

export interface ManagerInterface {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateCreated?: string;
  updatedAt?: string;
  pwd?: string;
  positionTitleId?: number;
}

export interface ManagerUpdatePasswordRequestInterface {
  currentPassword: string;
  newPassword: string;
}

export interface ResendEmailRequestInterface {
  email: string;
}

export interface VerifyManagerRequestInterface {
  managerID: number;
  verificationCode: string;
}

export interface GetManagerInterface {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: TitlesDBInterface;
}

export interface ManagerEditInfoRequestInterface {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
