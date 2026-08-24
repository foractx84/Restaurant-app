import { NextFunction, Request, Response } from 'express-serve-static-core';
import { EventSettingsControllerInterface, EventSettingsServiceInterface } from '@interfaces/eventSettings.interface';

class EventSettingsController implements EventSettingsControllerInterface {
  private eventSettingsService: EventSettingsServiceInterface;

  constructor(eventSettingsService: EventSettingsServiceInterface) {
    this.eventSettingsService = eventSettingsService;
  }

  getEventSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.eventSettingsService.getEventSettings(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updateEventSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.eventSettingsService.updateEventSettings(restaurantID, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export default EventSettingsController;
