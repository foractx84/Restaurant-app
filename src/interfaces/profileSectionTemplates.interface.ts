import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import { EntityManager } from 'typeorm';

export interface ProfileSectionTemplatesServiceInterface {
  getProfileSectionTemplatesByNames: (names: string[], repository?: EntityManager) => Promise<ProfileSectionTemplateEntity[]>;
}

export interface ProfileSectionTemplatesModelInterface {
  fetchProfileSectionTemplatesByNames: (names: string[], repository?: EntityManager) => Promise<ProfileSectionTemplateEntity[]>;
}

export interface ProfileSectionTemplateInterface {
  sectionTemplateID: number;
  template: string;
  createdAt?: Date;
  updatedAt?: Date;
}
