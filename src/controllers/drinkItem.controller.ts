import { NextFunction, Request, Response } from 'express-serve-static-core';
import { DrinkItemControllerInterface, DrinkItemServiceInterface } from '@interfaces/drinkItem.interface';

class DrinkItemController implements DrinkItemControllerInterface {
  private drinkItemService: DrinkItemServiceInterface;

  constructor(drinkItemService: DrinkItemServiceInterface) {
    this.drinkItemService = drinkItemService;
  }

  getDrinkItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = parseInt(res.locals.restaurantID);
      const result = await this.drinkItemService.getDrinkItemsByRestaurantID(restaurantID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export default DrinkItemController;
