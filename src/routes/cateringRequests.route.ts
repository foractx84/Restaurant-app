import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { CateringRequestIdParamDto, ListCateringRequestsQueryDto, UpdateCateringRequestStatusBodyDto } from '@dtos/cateringRequests.dto';
import { CateringRequestsControllerInterface } from '@interfaces/cateringRequests.interface';

class CateringRequestsRoute implements Route {
  public path = '/cateringRequests';
  public router = Router();

  private cateringRequestsController: CateringRequestsControllerInterface;

  constructor(cateringRequestsController: CateringRequestsControllerInterface) {
    this.cateringRequestsController = cateringRequestsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', validationMiddleware(ListCateringRequestsQueryDto, 'query'), this.cateringRequestsController.listCateringRequests);
    this.router.get(
      '/:cateringRequestID',
      validationMiddleware(CateringRequestIdParamDto, 'params'),
      this.cateringRequestsController.getCateringRequest,
    );
    this.router.put(
      '/:cateringRequestID/status',
      validationMiddleware(CateringRequestIdParamDto, 'params'),
      validationMiddleware(UpdateCateringRequestStatusBodyDto, 'body'),
      this.cateringRequestsController.updateCateringRequestStatus,
    );
    this.router.delete(
      '/:cateringRequestID',
      validationMiddleware(CateringRequestIdParamDto, 'params'),
      this.cateringRequestsController.deleteCateringRequest,
    );
  }
}

export default CateringRequestsRoute;
