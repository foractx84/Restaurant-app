import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdatePageOrderDto } from '@dtos/pageOrder.dto';
import { PageOrderControllerInterface } from '@interfaces/pageOrder.interface';

class PageOrderRoute implements Route {
  public path = '/pageOrder';
  public router = Router();

  private pageOrderController: PageOrderControllerInterface;

  constructor(pageOrderController: PageOrderControllerInterface) {
    this.pageOrderController = pageOrderController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.pageOrderController.getPageOrder);
    this.router.put('/', validationMiddleware(UpdatePageOrderDto, 'body'), this.pageOrderController.updatePageOrder);
  }
}

export default PageOrderRoute;
