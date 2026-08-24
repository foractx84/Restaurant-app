import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { DrinkItemControllerInterface } from '@interfaces/drinkItem.interface';

class DrinkItemsRoute implements Route {
  public path = '/drinkItems';
  public router = Router();

  private drinkItemController: DrinkItemControllerInterface;

  constructor(drinkItemController: DrinkItemControllerInterface) {
    this.drinkItemController = drinkItemController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.drinkItemController.getDrinkItems);
  }
}

export default DrinkItemsRoute;
