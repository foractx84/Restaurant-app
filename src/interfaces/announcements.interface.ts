import { Request, Response, NextFunction } from 'express';
import { EntityManager } from 'typeorm';
import { AnnouncementEntity } from '@/entities/announcement.entity';
import { AnnouncementImageResponseInterface } from '@interfaces/announcementImages.interface';
import { AnnouncementType } from '@/enums/announcementType';
import { MediaEntity } from '@entities/media.entity';

export interface AnnouncementsControllerInterface {
  createAnnouncement: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteAnnouncement: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  editAnnouncement: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAnnouncements: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  hideAnnouncement: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkAnnouncementToMedia: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  uploadAnnouncementImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface AnnouncementsModelInterface {
  fetchAnnouncementsByRestaurantIDOrNameOrID: (
    restaurantID: number,
    includeImage: boolean,
    name?: string,
    announcementID?: number,
    repository?: EntityManager,
  ) => Promise<AnnouncementEntity[]>;
  insertAnnouncement: (announcement: AnnouncementEntity, repository?: EntityManager) => Promise<AnnouncementEntity>;
  hideAnnouncement: (announcementID: number, hide: boolean, repository?: EntityManager) => Promise<void>;
  softDeleteAnnouncement: (announcementID: number, restaurantID: number) => Promise<void>;
  updateAnnouncement: (announcement: AnnouncementEntity, repository?: EntityManager) => Promise<void>;
}

export interface AnnouncementsServiceInterface {
  createAnnouncement: (
    createAnnouncementRequest: CreateAnnouncementRequestInterface,
    restaurantID: number,
  ) => Promise<CreateAnnouncementResponseInterface>;
  deleteAnnouncement: (announcementID: number, restaurantID: number) => Promise<void>;
  editAnnouncement: (editAnnouncementRequest: EditAnnouncementRequestInterface, restaurantID: number) => Promise<AnnouncementStatusResponseInterface>;
  getAnnouncementsByRestaurantID: (restaurantID: number) => Promise<GetAnnouncementsResponseInterface[]>;
  getAnnouncementByRestaurantIDOrNameOrID: (
    restaurantID: number,
    includeImage: boolean,
    name?: string,
    announcementID?: number,
  ) => Promise<AnnouncementEntity[]>;
  hideAnnouncement: (hideAnnouncementRequest: HideAnnouncementRequestInterface, restaurantID: number) => Promise<AnnouncementStatusResponseInterface>;
  linkAnnouncementToMedia: (linkRequest: LinkAnnouncementToMediaRequestInterface, restaurantID: number, media: MediaEntity[]) => Promise<void>;
  uploadAnnouncementImage: (
    image: string,
    announcementID: number,
    imagesToDelete: number[],
    restaurantID: number,
  ) => Promise<AnnouncementImageResponseInterface>;
}

export interface AnnouncementsDBInterface {
  announcement_id?: number;
  name?: string;
  title?: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  hidden?: boolean;
  submit_email?: boolean;
  restaurant_id?: number;
  announcement_type_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface AnnouncementTypesDBInterface {
  announcement_type_id?: number;
  type?: string;
  description: string;
}

export interface CreateAnnouncementRequestInterface {
  name: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: AnnouncementType;
  submitEmail?: boolean;
}

export interface CreateAnnouncementResponseInterface extends CreateAnnouncementRequestInterface {
  announcementID: number;
  hidden: boolean;
  active: boolean;
  type: AnnouncementType;
}

export interface DeleteAnnouncementsInterface {
  announcementID: number;
}

export interface EditAnnouncementRequestInterface {
  announcementID: number;
  name?: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  type?: AnnouncementType;
  submitEmail?: boolean;
}

export interface GetAnnouncementsResponseInterface {
  announcementID: number;
  name: string;
  title: string;
  description: string;
  image: AnnouncementImageResponseInterface;
  startDate: string;
  endDate: string;
  hidden: boolean;
  active: boolean;
  type?: AnnouncementType;
  submitEmail?: boolean;
}

export interface HideAnnouncementRequestInterface {
  announcementID: number;
  hide: boolean;
}

export interface AnnouncementStatusResponseInterface {
  active: boolean;
}

export interface LinkAnnouncementToMediaRequestInterface {
  announcementID: number;
  mediaIDs: number[];
}
