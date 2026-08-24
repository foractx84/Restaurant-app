import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import BrandsController from '@controllers/brands.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdateRestaurantOrderDto } from '@dtos/restaurant.dto';
import { BrandIDParamDto, BrandRestaurantParamDto } from '@dtos/brand.dto';

class BrandsRoute implements Route {
  public path = '/brands';
  public router = Router();

  private brandsController: BrandsController;

  constructor(brandsController: BrandsController) {
    this.brandsController = brandsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/:brandID/restaurants', validationMiddleware(BrandIDParamDto, 'params'), this.brandsController.getRestaurantsByBrandID);

    this.router.put(
      '/:brandID/restaurants/order',
      validationMiddleware(BrandIDParamDto, 'params'),
      validationMiddleware(UpdateRestaurantOrderDto, 'body'),
      this.brandsController.updateRestaurantOrder,
    );

    this.router.put(
      '/:brandID/restaurants/:restaurantID',
      validationMiddleware(BrandRestaurantParamDto, 'params'),
      this.brandsController.assignRestaurantToBrand,
    );

    this.router.get('/:brandID', validationMiddleware(BrandIDParamDto, 'params'), this.brandsController.getBrandByID);
  }
}

export default BrandsRoute;
