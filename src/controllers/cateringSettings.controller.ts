import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CateringSettingsControllerInterface, CateringSettingsServiceInterface } from '@interfaces/cateringSettings.interface';

class CateringSettingsController implements CateringSettingsControllerInterface {
  private cateringSettingsService: CateringSettingsServiceInterface;

  constructor(cateringSettingsService: CateringSettingsServiceInterface) {
    this.cateringSettingsService = cateringSettingsService;
  }

  getCateringSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.cateringSettingsService.getCateringSettings(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updateCateringSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.cateringSettingsService.updateCateringSettings(restaurantID, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export default CateringSettingsController;
