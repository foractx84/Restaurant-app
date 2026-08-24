import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { EventSettingsEntity } from '@/entities/eventSettings.entity';

export interface EventSettingsDBInterface {
  event_setting_id?: number;
  restaurant_id: number;
  section_title: string;
  events_text: string;
  deck_url?: string;
  is_inquiry_form_enabled: boolean;
  notification_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventSettingsResponseInterface {
  isEventsEnabled: boolean;
  sectionTitle: string;
  eventsText: string;
  deckUrl: string | null;
  isInquiryFormEnabled: boolean;
  notificationEmail: string | null;
}

export interface UpdateEventSettingsRequestInterface {
  isEventsEnabled: boolean;
  sectionTitle?: string;
  eventsText?: string;
  deckUrl?: string | null;
  isInquiryFormEnabled?: boolean;
  notificationEmail?: string | null;
}

export interface EventSettingsControllerInterface {
  getEventSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateEventSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface EventSettingsServiceInterface {
  getEventSettings: (restaurantID: number) => Promise<EventSettingsResponseInterface>;
  updateEventSettings: (restaurantID: number, update: UpdateEventSettingsRequestInterface) => Promise<EventSettingsResponseInterface>;
}

export interface EventSettingsModelInterface {
  fetchByRestaurantID: (restaurantID: number, repository?: EntityManager) => Promise<EventSettingsEntity | undefined>;
  upsertByRestaurantID: (restaurantID: number, patch: Partial<EventSettingsDBInterface>, repository?: EntityManager) => Promise<EventSettingsEntity>;
}
