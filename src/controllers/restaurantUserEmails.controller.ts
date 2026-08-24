import { NextFunction, Request, Response } from 'express-serve-static-core';
import { RestaurantUserEmailsControllerInterface, RestaurantUserEmailsServiceInterface } from '@interfaces/restaurantUserEmails.interface';

class RestaurantUserEmailsController implements RestaurantUserEmailsControllerInterface {
  private restaurantUserEmailsService: RestaurantUserEmailsServiceInterface;

  constructor(restaurantUserEmailsService: RestaurantUserEmailsServiceInterface) {
    this.restaurantUserEmailsService = restaurantUserEmailsService;
  }

  getRestaurantUserEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.restaurantUserEmailsService.getRestaurantUserEmails(parseInt(res.locals.restaurantID)));
    } catch (err) {
      next(err);
    }
  };
}

export default RestaurantUserEmailsController;
