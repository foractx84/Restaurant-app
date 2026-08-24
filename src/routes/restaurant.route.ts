import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { RestaurantControllerInterface } from '@interfaces/restaurants.interface';
import parseTokenMiddleware from '@middlewares/parseToken.middleware';
import { uploadImageMiddleware } from '@middlewares/uploadImage.middleware';
import { imageUpload } from '@utils/imageUtils';
import { reformatImageMiddleware } from '@middlewares/reformatImage.middleware';
import authorizationMiddleware from '@middlewares/authorization.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import {
  AssignPackageToRestaurantDto,
  CreateRestaurantDto,
  EditRestaurantDto,
  LinkStripeConnectAccountDto,
  RestaurantReservationOrderingLinksDto,
} from '@/dtos/restaurant.dto';
import { UpdateRestaurantColorSettingsDto, UpdateRestaurantFontSettingsDto } from '@/dtos/restaurantTypography.dto';
import checkRestaurantAddressIDAndRestaurantIDMiddleware from '@middlewares/checkRestaurantAddressIDAndRestaurantID.middleware';
import { PackageControllerInterface } from '@interfaces/package.interface';
class RestaurantRoute implements Route {
  public path = '/restaurant';
  public router = Router();

  private packageController: PackageControllerInterface;
  private restaurantController: RestaurantControllerInterface;

  constructor(packageController: PackageControllerInterface, restaurantController: RestaurantControllerInterface) {
    this.packageController = packageController;
    this.restaurantController = restaurantController;
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router.get('/', authorizationMiddleware, this.restaurantController.getRestaurantDetails);
    this.router.post('/', parseTokenMiddleware, validationMiddleware(CreateRestaurantDto, 'body'), this.restaurantController.createRestaurant);
    this.router.put(
      '/',
      authorizationMiddleware,
      validationMiddleware(EditRestaurantDto, 'body'),
      checkRestaurantAddressIDAndRestaurantIDMiddleware,
      this.restaurantController.editRestaurant,
    );
    this.router.post(
      '/image',
      authorizationMiddleware,
      uploadImageMiddleware(
        imageUpload.fields([
          { name: `profile`, maxCount: 10 },
          { name: `logo`, maxCount: 1 },
          { name: `thumbnail`, maxCount: 1 },
          { name: `menuCover`, maxCount: 1 },
          { name: `gallery`, maxCount: 15 },
        ]),
      ),
      reformatImageMiddleware,
      this.restaurantController.uploadRestaurantImages,
    );
    this.router.post(
      '/package',
      authorizationMiddleware,
      validationMiddleware(AssignPackageToRestaurantDto, 'body'),
      this.packageController.assignPackageToRestaurant,
    );
    this.router.put(
      '/urls',
      authorizationMiddleware,
      validationMiddleware(RestaurantReservationOrderingLinksDto, 'body'),
      this.restaurantController.updateRestaurantReservationOrderingLinks,
    );
    this.router.put(
      '/stripe-connect',
      authorizationMiddleware,
      validationMiddleware(LinkStripeConnectAccountDto, 'body'),
      this.restaurantController.linkStripeConnectAccount,
    );
    this.router.post('/stripe-connect/onboarding-link', authorizationMiddleware, this.restaurantController.getStripeConnectOnboardingUrl);
    this.router.get('/design/fonts', authorizationMiddleware, this.restaurantController.getRestaurantFontSettings);
    this.router.put(
      '/design/fonts',
      authorizationMiddleware,
      validationMiddleware(UpdateRestaurantFontSettingsDto, 'body'),
      this.restaurantController.saveRestaurantFontSettings,
    );
    this.router.get('/design/colors', authorizationMiddleware, this.restaurantController.getRestaurantColorSettings);
    this.router.put(
      '/design/colors',
      authorizationMiddleware,
      validationMiddleware(UpdateRestaurantColorSettingsDto, 'body'),
      this.restaurantController.saveRestaurantColorSettings,
    );
  }
}

export default RestaurantRoute;
