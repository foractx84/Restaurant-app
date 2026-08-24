import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdateCareersSettingsDto } from '@dtos/careersSettings.dto';
import { CareersSettingsControllerInterface } from '@interfaces/careersSettings.interface';

class CareersSettingsRoute implements Route {
  public path = '/careersSettings';
  public router = Router();

  private careersSettingsController: CareersSettingsControllerInterface;

  constructor(careersSettingsController: CareersSettingsControllerInterface) {
    this.careersSettingsController = careersSettingsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.careersSettingsController.getCareersSettings);
    this.router.put('/', validationMiddleware(UpdateCareersSettingsDto, 'body'), this.careersSettingsController.updateCareersSettings);
  }
}

export default CareersSettingsRoute;
