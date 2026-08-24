import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdateCateringSettingsDto } from '@dtos/cateringSettings.dto';
import { CateringSettingsControllerInterface } from '@interfaces/cateringSettings.interface';

class CateringSettingsRoute implements Route {
  public path = '/cateringSettings';
  public router = Router();

  private cateringSettingsController: CateringSettingsControllerInterface;

  constructor(cateringSettingsController: CateringSettingsControllerInterface) {
    this.cateringSettingsController = cateringSettingsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.cateringSettingsController.getCateringSettings);
    this.router.put('/', validationMiddleware(UpdateCateringSettingsDto, 'body'), this.cateringSettingsController.updateCateringSettings);
  }
}

export default CateringSettingsRoute;
