import { NextFunction, Request, Response } from 'express-serve-static-core';
import BrandsService from '@services/brands.service';

class BrandsController {
  private brandsService: BrandsService;

  constructor(brandsService: BrandsService) {
    this.brandsService = brandsService;
  }

  getBrandsByRestaurantGroupID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantGroupID = req.params.restaurantGroupID;

      res.json(await this.brandsService.getBrandsByRestaurantGroupID(restaurantGroupID));
    } catch (err) {
      next(err);
    }
  };

  getBrandByID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandID = req.params.brandID;

      res.json(await this.brandsService.getBrandByID(brandID));
    } catch (err) {
      next(err);
    }
  };

  createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantGroupID = req.params.restaurantGroupID;
      const { name } = req.body;

      res.status(201).json(await this.brandsService.createBrand(restaurantGroupID, name));
    } catch (err) {
      next(err);
    }
  };

  getRestaurantsByBrandID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandID = req.params.brandID;

      res.json(await this.brandsService.getRestaurantsByBrandID(brandID));
    } catch (err) {
      next(err);
    }
  };

  assignRestaurantToBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandID = req.params.brandID;
      const restaurantID = Number(req.params.restaurantID);

      await this.brandsService.assignRestaurantToBrand(restaurantID, brandID);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  updateRestaurantOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandID = req.params.brandID;
      const { restaurantIDs } = req.body;

      await this.brandsService.updateRestaurantOrder(brandID, restaurantIDs);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export default BrandsController;
