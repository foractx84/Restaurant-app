import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { CuisinesControllerInterface } from '@interfaces/cuisines.interface';

class CuisinesRoute implements Route {
  public path = '/cuisines';
  public router = Router();

  private cuisinesController: CuisinesControllerInterface;

  constructor(cuisinesController: CuisinesControllerInterface) {
    this.cuisinesController = cuisinesController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.cuisinesController.getAllCuisines);
  }
}

export default CuisinesRoute;
