import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdateEventSettingsDto } from '@dtos/eventSettings.dto';
import { EventSettingsControllerInterface } from '@interfaces/eventSettings.interface';

class EventSettingsRoute implements Route {
  public path = '/eventSettings';
  public router = Router();

  private eventSettingsController: EventSettingsControllerInterface;

  constructor(eventSettingsController: EventSettingsControllerInterface) {
    this.eventSettingsController = eventSettingsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.eventSettingsController.getEventSettings);
    this.router.put('/', validationMiddleware(UpdateEventSettingsDto, 'body'), this.eventSettingsController.updateEventSettings);
  }
}

export default EventSettingsRoute;
