import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CareersSettingsControllerInterface, CareersSettingsServiceInterface } from '@interfaces/careersSettings.interface';

class CareersSettingsController implements CareersSettingsControllerInterface {
  private careersSettingsService: CareersSettingsServiceInterface;

  constructor(careersSettingsService: CareersSettingsServiceInterface) {
    this.careersSettingsService = careersSettingsService;
  }

  getCareersSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.careersSettingsService.getCareersSettings(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updateCareersSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.careersSettingsService.updateCareersSettings(restaurantID, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export default CareersSettingsController;
