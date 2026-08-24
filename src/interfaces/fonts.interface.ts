import { FontCategory } from '@/enums/fontCategory';
import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { FontEntity } from '@/entities/font.entity';

export interface FontsControllerInterface {
  getFonts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface FontsServiceInterface {
  getFonts: () => Promise<GetFontsResponseInterface>;
}

export interface FontsModelInterface {
  getSelectableFonts: (repository?: EntityManager) => Promise<FontEntity[]>;
}

export interface FontDBInterface {
  title: string;
  category: FontCategory;
  usage_notes?: string;
  is_selectable: boolean;
  list_order: number;
}

export interface FontListItemInterface {
  title: string;
  category: FontCategory;
  usageNotes?: string;
  listOrder: number;
}

export interface GetFontsResponseInterface {
  fonts: FontListItemInterface[];
}
