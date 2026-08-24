import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { CareerRequestIdParamDto, ListCareerRequestsQueryDto, UpdateCareerRequestStatusBodyDto } from '@dtos/careerRequests.dto';
import { CareerRequestsControllerInterface } from '@interfaces/careerRequests.interface';

class CareerRequestsRoute implements Route {
  public path = '/careerRequests';
  public router = Router();

  private careerRequestsController: CareerRequestsControllerInterface;

  constructor(careerRequestsController: CareerRequestsControllerInterface) {
    this.careerRequestsController = careerRequestsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', validationMiddleware(ListCareerRequestsQueryDto, 'query'), this.careerRequestsController.listCareerRequests);
    this.router.get('/:careerRequestID', validationMiddleware(CareerRequestIdParamDto, 'params'), this.careerRequestsController.getCareerRequest);
    this.router.put(
      '/:careerRequestID/status',
      validationMiddleware(CareerRequestIdParamDto, 'params'),
      validationMiddleware(UpdateCareerRequestStatusBodyDto, 'body'),
      this.careerRequestsController.updateCareerRequestStatus,
    );
    this.router.delete(
      '/:careerRequestID',
      validationMiddleware(CareerRequestIdParamDto, 'params'),
      this.careerRequestsController.deleteCareerRequest,
    );
  }
}

export default CareerRequestsRoute;
