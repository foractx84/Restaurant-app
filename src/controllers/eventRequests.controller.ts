import { NextFunction, Request, Response } from 'express-serve-static-core';
import { EventRequestStatus, EventRequestsControllerInterface, EventRequestsServiceInterface } from '@interfaces/eventRequests.interface';

class EventRequestsController implements EventRequestsControllerInterface {
  private eventRequestsService: EventRequestsServiceInterface;

  constructor(eventRequestsService: EventRequestsServiceInterface) {
    this.eventRequestsService = eventRequestsService;
  }

  listEventRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const status = (req.query.status as EventRequestStatus) || undefined;
      res.json(await this.eventRequestsService.listEventRequests(restaurantID, { status }));
    } catch (err) {
      next(err);
    }
  };

  getEventRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const eventRequestID = parseInt(req.params.eventRequestID);
      res.json(await this.eventRequestsService.getEventRequest(eventRequestID, restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updateEventRequestStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const eventRequestID = parseInt(req.params.eventRequestID);
      res.json(await this.eventRequestsService.updateEventRequestStatus(eventRequestID, restaurantID, req.body.status));
    } catch (err) {
      next(err);
    }
  };

  deleteEventRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const eventRequestID = parseInt(req.params.eventRequestID);
      await this.eventRequestsService.deleteEventRequest(eventRequestID, restaurantID);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

export default EventRequestsController;
