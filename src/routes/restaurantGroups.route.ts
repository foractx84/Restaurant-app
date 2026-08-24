import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import RestaurantGroupsController from '@controllers/restaurantGroups.controller';
import BrandsController from '@controllers/brands.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { CreateRestaurantGroupDto, RestaurantGroupIDParamDto } from '@dtos/restaurantGroup.dto';
import { CreateBrandDto } from '@dtos/brand.dto';

class RestaurantGroupsRoute implements Route {
  public path = '/restaurant-groups';
  public router = Router();

  private restaurantGroupsController: RestaurantGroupsController;
  private brandsController: BrandsController;

  constructor(restaurantGroupsController: RestaurantGroupsController, brandsController: BrandsController) {
    this.restaurantGroupsController = restaurantGroupsController;
    this.brandsController = brandsController;

    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.restaurantGroupsController.getAllRestaurantGroups);

    this.router.post('/', validationMiddleware(CreateRestaurantGroupDto, 'body'), this.restaurantGroupsController.createRestaurantGroup);

    this.router.get(
      '/:restaurantGroupID/brands',
      validationMiddleware(RestaurantGroupIDParamDto, 'params'),
      this.brandsController.getBrandsByRestaurantGroupID,
    );

    this.router.post(
      '/:restaurantGroupID/brands',
      validationMiddleware(RestaurantGroupIDParamDto, 'params'),
      validationMiddleware(CreateBrandDto, 'body'),
      this.brandsController.createBrand,
    );

    this.router.get(
      '/:restaurantGroupID',
      validationMiddleware(RestaurantGroupIDParamDto, 'params'),
      this.restaurantGroupsController.getRestaurantGroupByID,
    );
  }
}

export default RestaurantGroupsRoute;
