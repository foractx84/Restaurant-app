import { NextFunction, Request, Response } from 'express';
import { ProfileSectionInterface, ProfileSectionWithCardMediaInterface } from '@interfaces/profileSections.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { EntityManager } from 'typeorm';
import { CustomRequest } from '@interfaces/CustomRequest.interface';

export interface ProfilePagesControllerInterface {
  createProfilePage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editProfilePage: (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => Promise<void>;
  getProfilePageDetails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface ProfilePagesServiceInterface {
  createProfilePage: (request: CreateProfilePageRequestInterface, restaurantID: number) => Promise<CreateProfilePageResponseInterface>;
  editProfilePage: (request: EditProfilePageRequestInterface, restaurantID: number) => Promise<void>;
  getProfilePageByRestaurantID: (restaurantID: number) => Promise<ProfilePageEntity[]>;
  getProfilePageDetails: (profilePageID: number) => Promise<CreateProfilePageResponseInterface>;
}

export interface ProfilePagesModelInterface {
  fetchProfilePageByPageID: (pageID: number) => Promise<ProfilePageEntity>;
  fetchProfilePagesByRestaurantID: (restaurantID: number) => Promise<ProfilePageEntity[]>;
  upsertProfilePage: (profilePage: Partial<ProfilePageEntity>, repository?: EntityManager) => Promise<ProfilePageEntity>;
}

export interface RestaurantProfilePageInterface {
  restaurantProfilePageID?: number;
  name: string;
  title?: string;
  seoTitle: string;
  seoDescription?: string;
  urlPath?: string;
  navLink?: string;
  restaurantID?: number;
  listOrder?: number;
  isHidden?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateProfilePageRequestInterface {
  name: string;
  seoTitle: string;
  seoDescription?: string;
  urlPath?: string;
  navLink?: string;
  isHidden: boolean;
  profileSections?: ProfileSectionInterface[];
}

export interface CreateProfilePageResponseInterface {
  pageID: number;
  name: string;
  seoTitle: string;
  seoDescription?: string;
  urlPath?: string;
  navLink?: string;
  isHidden: boolean;
  profileSections?: ProfileSectionInterface[];
}

export interface EditProfilePageRequestInterface {
  pageID?: number;
  name?: string;
  seoTitle?: string;
  seoDescription?: string;
  urlPath?: string;
  navLink?: string;
  isHidden?: boolean;
}

export interface GetProfilePageResponseInterface {
  pageID: number;
  name: string;
  isHidden: boolean;
}

export interface GetProfilePageDetailsResponseInterface {
  pageID: number;
  name: string;
  seoTitle: string;
  seoDescription?: string;
  urlPath?: string;
  navLink?: string;
  isHidden: boolean;
  profileSections?: ProfileSectionWithCardMediaInterface[];
}
