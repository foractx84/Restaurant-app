import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { EventRequestIdParamDto, ListEventRequestsQueryDto, UpdateEventRequestStatusBodyDto } from '@dtos/eventRequests.dto';
import { EventRequestsControllerInterface } from '@interfaces/eventRequests.interface';

class EventRequestsRoute implements Route {
  public path = '/eventRequests';
  public router = Router();

  private eventRequestsController: EventRequestsControllerInterface;

  constructor(eventRequestsController: EventRequestsControllerInterface) {
    this.eventRequestsController = eventRequestsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', validationMiddleware(ListEventRequestsQueryDto, 'query'), this.eventRequestsController.listEventRequests);
    this.router.get('/:eventRequestID', validationMiddleware(EventRequestIdParamDto, 'params'), this.eventRequestsController.getEventRequest);
    this.router.put(
      '/:eventRequestID/status',
      validationMiddleware(EventRequestIdParamDto, 'params'),
      validationMiddleware(UpdateEventRequestStatusBodyDto, 'body'),
      this.eventRequestsController.updateEventRequestStatus,
    );
    this.router.delete('/:eventRequestID', validationMiddleware(EventRequestIdParamDto, 'params'), this.eventRequestsController.deleteEventRequest);
  }
}

export default EventRequestsRoute;
