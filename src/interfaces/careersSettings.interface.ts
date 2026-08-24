import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { CareersSettingsEntity } from '@/entities/careersSettings.entity';

export interface CareersSettingsDBInterface {
  careers_setting_id?: number;
  restaurant_id: number;
  section_title: string;
  careers_text: string;
  is_inquiry_form_enabled: boolean;
  notification_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CareersSettingsResponseInterface {
  isCareersEnabled: boolean;
  sectionTitle: string;
  careersText: string;
  isInquiryFormEnabled: boolean;
  notificationEmail: string | null;
}

export interface UpdateCareersSettingsRequestInterface {
  isCareersEnabled: boolean;
  sectionTitle?: string;
  careersText?: string;
  isInquiryFormEnabled?: boolean;
  notificationEmail?: string | null;
}

export interface CareersSettingsControllerInterface {
  getCareersSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateCareersSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface CareersSettingsServiceInterface {
  getCareersSettings: (restaurantID: number) => Promise<CareersSettingsResponseInterface>;
  updateCareersSettings: (restaurantID: number, update: UpdateCareersSettingsRequestInterface) => Promise<CareersSettingsResponseInterface>;
}

export interface CareersSettingsModelInterface {
  fetchByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<CareersSettingsEntity | undefined>;
  upsertByRestaurantID: (
    restaurantID: number,
    patch: Partial<CareersSettingsDBInterface>,
    repository?: EntityManager,
  ) => Promise<CareersSettingsEntity>;
}
