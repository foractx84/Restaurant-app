import { NextFunction, Request, Response } from 'express';
import { TitleEntity } from '@/entities/title.entity';
import { EntityManager } from 'typeorm';

export interface TitlesControllerInterface {
  getTitles: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface TitlesServiceInterface {
  getTitles: () => Promise<GetTitlesResponseInterface>;
}

export interface TitlesModelInterface {
  getTitleByName: (titleName: string, repository?: EntityManager) => Promise<TitlesDBInterface>;
  insertTitle: (titleName: string, repository?: EntityManager) => Promise<TitlesDBInterface>;
  getTitles: (repository?: EntityManager) => Promise<TitleEntity[]>;
}
export interface TitlesDBInterface {
  titleID: number;
  name: string;
}
export interface GetTitlesResponseInterface {
  titles: TitlesDBInterface[];
}

export interface TitleDBInterface {
  id: number;
  name: string;
}
