import { EntityManager } from 'typeorm';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { NextFunction, Request, Response } from 'express';
import { CreateProfileSectionCardsDto, EditProfileSectionCardsDto } from '@/dtos/profileSections.dto';
import { ProfileSectionCardResponseInterface, RestaurantProfileSectionCardsInterface } from './profileCards.interface';
import { MediaResponseInterface } from './mediaLibrary.interface';
import { MediaEntity } from '@/entities/media.entity';

export interface ProfileSectionsControllerInterface {
  createCard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createProfileSection: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteCard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editCard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editProfileSection: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteProfileSection: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkMediaToProfileCard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface ProfileSectionsServiceInterface {
  buildProfileSectionEntities: (
    profileSections: ProfileSectionInterface[],
    profilePageID: number,
    repository?: EntityManager,
  ) => Promise<ProfileSectionEntity[]>;
  createCard: (card: CreateProfileSectionCardsDto) => Promise<RestaurantProfileSectionCardsInterface>;
  createProfileSection: (profileSectionRequest: CreateProfileSectionRequest, restaurantID: number) => Promise<ProfileSectionInterface>;
  createProfileSections: (profileSectionEntities: Partial<ProfileSectionEntity>[], repository?: EntityManager) => Promise<ProfileSectionEntity[]>;
  deleteCard: (cardID: number, repository?: EntityManager) => Promise<void>;
  editCard: (card: EditProfileSectionCardsDto) => Promise<void>;
  editProfileSection: (profileSection: ProfileSectionInterface) => Promise<void>;
  deleteProfileSection: (sectionID: number, repository?: EntityManager) => Promise<void>;
  linkMedia: (mediaIDs: number[], restaurantID: number, sectionID: number) => Promise<void>;
  linkMediaToProfileCard: (media: number, cardID: number) => Promise<void>;
}

export interface ProfileSectionsModelInterface {
  fetchPageSectionByID: (sectionID: number, entityManager?: EntityManager) => Promise<ProfileSectionEntity>;
  fetchProfilePageSectionByID: (sectionID: number) => Promise<ProfileSectionEntity>;
  upsertProfileSections: (profileSectionEntities: Partial<ProfileSectionEntity>[], repository?: EntityManager) => Promise<ProfileSectionEntity[]>;
  softDeleteProfileSection: (sectionID: number, repository?: EntityManager) => Promise<void>;
}

export interface RestaurantProfileSectionInterface {
  restaurantProfileSectionID?: number;
  restaurantProfilePageID?: number;
  sectionTemplateID?: number;
  name: string;
  title?: string;
  content?: string;
  urlPath?: string;
  subNav?: string;
  listOrder?: number;
  isHidden?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateProfileSectionRequest {
  pageID: number;
  name: string;
  title?: string;
  content?: string;
  template: string;
  urlPath?: string;
  subNav?: string;
  isHidden?: boolean;
}

export interface ProfileSectionInterface {
  sectionID?: number;
  name?: string;
  title?: string;
  content?: string;
  template: string;
  urlPath?: string;
  subNav?: string;
  isHidden?: boolean;
}

export interface ProfileSectionWithCardMediaInterface {
  sectionID?: number;
  name?: string;
  title?: string;
  content?: string;
  template: string;
  urlPath?: string;
  subNav?: string;
  isHidden?: boolean;
  media?: MediaResponseInterface[];
  cards?: ProfileSectionCardResponseInterface[];
}
