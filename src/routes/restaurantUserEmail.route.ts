import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import authorizationMiddleware from '@middlewares/authorization.middleware';
import { RestaurantUserEmailsControllerInterface } from '@interfaces/restaurantUserEmails.interface';
class RestaurantUserEmailRoute implements Route {
  public path = '/restaurant';
  public router = Router();

  private restaurantUserEmailsController: RestaurantUserEmailsControllerInterface;

  constructor(restaurantUserEmailsController: RestaurantUserEmailsControllerInterface) {
    this.restaurantUserEmailsController = restaurantUserEmailsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/emails', authorizationMiddleware, this.restaurantUserEmailsController.getRestaurantUserEmails);
  }
}

export default RestaurantUserEmailRoute;
