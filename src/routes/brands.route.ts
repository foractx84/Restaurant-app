import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import BrandsController from '@controllers/brands.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdateRestaurantOrderDto } from '@dtos/restaurant.dto';
import { BrandIDParamDto, BrandRestaurantParamDto, EditBrandDto } from '@dtos/brand.dto';
import { uploadImageMiddleware } from '@middlewares/uploadImage.middleware';
import { imageUpload } from '@utils/imageUtils';
import { reformatImageMiddleware } from '@middlewares/reformatImage.middleware';

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

    this.router.post(
      '/:brandID/logo',
      validationMiddleware(BrandIDParamDto, 'params'),
      uploadImageMiddleware(imageUpload.fields([{ name: 'logo', maxCount: 1 }])),
      reformatImageMiddleware,
      this.brandsController.uploadBrandLogo,
    );

    this.router.put(
      '/:brandID',
      validationMiddleware(BrandIDParamDto, 'params'),
      validationMiddleware(EditBrandDto, 'body'),
      this.brandsController.updateBrand,
    );

    this.router.get('/:brandID', validationMiddleware(BrandIDParamDto, 'params'), this.brandsController.getBrandByID);
  }
}

export default BrandsRoute;
