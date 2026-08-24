import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { RestaurantControllerInterface } from '@interfaces/restaurants.interface';
import parseTokenMiddleware from '@middlewares/parseToken.middleware';

class RestaurantRoute implements Route {
  public path = '/restaurants';
  public router = Router();

  private restaurantController: RestaurantControllerInterface;

  constructor(restaurantController: RestaurantControllerInterface) {
    this.restaurantController = restaurantController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', parseTokenMiddleware, this.restaurantController.readRestaurants);
    this.router.get('/backup', parseTokenMiddleware, this.restaurantController.backupRestaurantMenus);
  }
}

export default RestaurantRoute;
