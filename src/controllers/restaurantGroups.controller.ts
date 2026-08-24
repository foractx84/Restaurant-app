import { NextFunction, Request, Response } from 'express-serve-static-core';
import RestaurantGroupsService from '@services/restaurantGroups.service';

class RestaurantGroupsController {
  private restaurantGroupsService: RestaurantGroupsService;

  constructor(restaurantGroupsService: RestaurantGroupsService) {
    this.restaurantGroupsService = restaurantGroupsService;
  }

  getAllRestaurantGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.restaurantGroupsService.getAllRestaurantGroups());
    } catch (err) {
      next(err);
    }
  };

  getRestaurantGroupByID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantGroupID = req.params.restaurantGroupID;

      res.json(await this.restaurantGroupsService.getRestaurantGroupByID(restaurantGroupID));
    } catch (err) {
      next(err);
    }
  };

  createRestaurantGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;

      res.status(201).json(await this.restaurantGroupsService.createRestaurantGroup(name));
    } catch (err) {
      next(err);
    }
  };
}

export default RestaurantGroupsController;
