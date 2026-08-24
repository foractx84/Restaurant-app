import { Response, Request, NextFunction } from 'express-serve-static-core';
import { TitlesControllerInterface, TitlesServiceInterface } from '@/interfaces/titles.interface';

class TitlesController implements TitlesControllerInterface {
  private titlesService: TitlesServiceInterface;

  constructor(titlesService: TitlesServiceInterface) {
    this.titlesService = titlesService;
  }

  getTitles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.titlesService.getTitles());
    } catch (err) {
      next(err);
    }
  };
}

export default TitlesController;
