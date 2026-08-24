import { NextFunction, Request, Response } from 'express';

export interface CateringSettingsResponseInterface {
  isCateringEnabled: boolean;
  cateringNotificationEmail: string | null;
}

export interface UpdateCateringSettingsRequestInterface {
  isCateringEnabled: boolean;
  cateringNotificationEmail?: string | null;
}

export interface CateringSettingsControllerInterface {
  getCateringSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateCateringSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface CateringSettingsServiceInterface {
  getCateringSettings: (restaurantID: number) => Promise<CateringSettingsResponseInterface>;
  updateCateringSettings: (restaurantID: number, update: UpdateCateringSettingsRequestInterface) => Promise<CateringSettingsResponseInterface>;
}
