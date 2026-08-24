import { Router } from 'express';
import IndexController from '@controllers/index.controller';
import RouteInterface from '@interfaces/routes.interface';

class IndexRoute implements RouteInterface {
  public path = '/';
  public router = Router();
  public indexController = new IndexController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.indexController.index);
  }
}

export default IndexRoute;
