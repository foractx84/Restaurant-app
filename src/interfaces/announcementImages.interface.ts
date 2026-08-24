import { AnnouncementImageEntity } from '@/entities/announcementImage.entity';
import { EntityManager } from 'typeorm';
import { MediaEntity } from '@entities/media.entity';

export interface AnnouncementImagesServiceInterface {
  deleteImages: (imageIDs: number[], announcementID: number, repository?: EntityManager) => Promise<void>;
  insertAnnouncementImage: (announcementImageEntity: AnnouncementImageEntity, repository?: EntityManager) => Promise<AnnouncementImageEntity>;
  insertAnnouncementMedia: (announcementID: number, media: MediaEntity[], entityManager?: EntityManager) => Promise<void>;
  validateImagesToDelete: (existingImageIDs: number[], idsToDelete: number[]) => void;
}

export interface AnnouncementImagesModelInterface {
  insertImage: (announcementImage: AnnouncementImageEntity, repository?: EntityManager) => Promise<AnnouncementImageEntity>;
  insertAnnouncementMedia: (announcementImage: AnnouncementImageEntity[], entityManager?: EntityManager) => Promise<void>;
  softDeleteAnnouncementImages: (imageIDs: number[], announcementID: number, repository?: EntityManager) => Promise<void>;
}

export interface AnnouncementImageResponseInterface {
  imageID: number;
  imageURL: string;
}

export interface UploadAnnouncementImageRequestInterface {
  imagesToDelete: string;
  announcementID: string;
}

export interface AnnouncementImageDBInterface {
  announcement_image_id?: number;
  announcement_id?: number;
  image_url: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}
