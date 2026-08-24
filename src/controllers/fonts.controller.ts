import { FontsControllerInterface, FontsServiceInterface } from '@/interfaces/fonts.interface';
import { NextFunction, Request, Response } from 'express';

class FontsController implements FontsControllerInterface {
  private fontsService: FontsServiceInterface;

  constructor(fontsService: FontsServiceInterface) {
    this.fontsService = fontsService;
  }

  getFonts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.fontsService.getFonts());
    } catch (err) {
      next(err);
    }
  };
}

export default FontsController;
