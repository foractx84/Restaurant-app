import { NextFunction, Request, Response } from 'express-serve-static-core';
import {
  CreateRestaurantRequestInterface,
  EditRestaurantRequestInterface,
  RestaurantBackupServiceInterface,
  RestaurantControllerInterface,
  RestaurantReservationOrderingLinksInterface,
  RestaurantsServiceInterface,
} from '@interfaces/restaurants.interface';
import {
  RestaurantColorSettingsInterface,
  RestaurantFontSettingsInterface,
  RestaurantTypographyServiceInterface,
} from '@/interfaces/restaurantTypography.interface';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';
import { deleteImageIfExists } from '@utils/imageUtils';
import { UploadRestaurantImagesRequestInterface } from '@interfaces/restaurantImages.interface';
import { validateArrayOfIDs } from '@utils/util';

class RestaurantController implements RestaurantControllerInterface {
  private restaurantService: RestaurantsServiceInterface;
  private restaurantBackupService: RestaurantBackupServiceInterface;
  private stripeConnectService: StripeConnectServiceInterface;
  private restaurantTypographyService: RestaurantTypographyServiceInterface;

  constructor(
    restaurantService: RestaurantsServiceInterface,
    restaurantBackupService: RestaurantBackupServiceInterface,
    stripeConnectService: StripeConnectServiceInterface,
    restaurantTypographyService: RestaurantTypographyServiceInterface,
  ) {
    this.restaurantService = restaurantService;
    this.restaurantBackupService = restaurantBackupService;
    this.stripeConnectService = stripeConnectService;
    this.restaurantTypographyService = restaurantTypographyService;
  }

  createRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantData = req.body as CreateRestaurantRequestInterface;
      const managerID: number = parseInt(res.locals.managerID);
      const isSuper = !!res.locals.isSuper;
      res.json(await this.restaurantService.createRestaurant(managerID, restaurantData, isSuper));
    } catch (err) {
      next(err);
    }
  };

  editRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const editRequest = req.body as EditRestaurantRequestInterface;
      const restaurantID: number = parseInt(res.locals.restaurantID);
      await this.restaurantService.editRestaurant(editRequest, restaurantID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getRestaurantDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.restaurantService.getRestaurantDetails(parseInt(res.locals.restaurantID)));
    } catch (err) {
      next(err);
    }
  };

  readRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const managerID: number = parseInt(res.locals.managerID);
      const isSuper = !!res.locals.isSuper;
      res.json(await this.restaurantService.findRestaurantsByManagerID(managerID, isSuper));
    } catch (err) {
      next(err);
    }
  };

  updateRestaurantReservationOrderingLinks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantLinks = req.body as RestaurantReservationOrderingLinksInterface;
      const restaurantID: number = parseInt(res.locals.restaurantID);
      await this.restaurantService.updateRestaurantReservationOrderingLinks(restaurantLinks, restaurantID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  uploadRestaurantImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { body, files } = req;
    const profileImages = files?.['profile']?.map(image => image?.filename) ?? [];
    const logoImage = files?.['logo']?.[0];
    const thumbnailImage = files?.['thumbnail']?.[0];
    const menuCoverImage = files?.['menuCover']?.[0];
    const galleryImages = files?.['gallery']?.map(image => image?.filename) ?? [];
    try {
      const restaurantID: number = res.locals?.restaurantID;
      const { imagesToDelete, galleryImagesToDelete, galleryOrder } = body as UploadRestaurantImagesRequestInterface;

      const idsToDelete = !!imagesToDelete ? JSON.parse(imagesToDelete) : [];
      validateArrayOfIDs(idsToDelete);

      const galleryIDsToDelete = !!galleryImagesToDelete ? JSON.parse(galleryImagesToDelete) : [];
      validateArrayOfIDs(galleryIDsToDelete);

      const galleryIDsOrder = !!galleryOrder ? JSON.parse(galleryOrder) : [];
      validateArrayOfIDs(galleryIDsOrder);

      const result = await this.restaurantService.uploadRestaurantImages(
        galleryImages,
        galleryIDsToDelete,
        galleryIDsOrder,
        idsToDelete,
        logoImage?.filename,
        menuCoverImage?.filename,
        profileImages,
        restaurantID,
        thumbnailImage?.filename,
      );
      if (Object.keys(result).length > 0) {
        res.json(result);
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      /**
       * If error occurs while uploading images then we will want to roll back the upload
       */
      if (profileImages?.length) {
        await profileImages.forEach(async imageURL => {
          await deleteImageIfExists(imageURL);
        });
      }
      if (logoImage) {
        await deleteImageIfExists(logoImage.filename);
      }
      if (thumbnailImage) {
        await deleteImageIfExists(thumbnailImage.filename);
      }
      if (menuCoverImage) {
        await deleteImageIfExists(menuCoverImage.filename);
      }
      if (galleryImages?.length) {
        await galleryImages.forEach(async imageURL => {
          await deleteImageIfExists(imageURL);
        });
      }
      next(err);
    }
  };

  backupRestaurantMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.restaurantBackupService.generateRestaurantBackups();
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkStripeConnectAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const { stripeAccountId } = req.body as { stripeAccountId: string };
      await this.stripeConnectService.linkExistingConnectAccount(restaurantID, stripeAccountId);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getStripeConnectOnboardingUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const { account_id, onboarding_url } = await this.stripeConnectService.createConnectedAccountForRestaurant(restaurantID);
      res.json({ onboarding_url, account_id });
    } catch (err) {
      next(err);
    }
  };

  getRestaurantFontSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.restaurantTypographyService.getFontSettings(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  saveRestaurantFontSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const fonts = req.body as RestaurantFontSettingsInterface;
      res.json(await this.restaurantTypographyService.saveFontSettings(restaurantID, fonts));
    } catch (err) {
      next(err);
    }
  };

  getRestaurantColorSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.restaurantTypographyService.getColorSettings(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  saveRestaurantColorSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const colors = req.body as RestaurantColorSettingsInterface;
      res.json(await this.restaurantTypographyService.saveColorSettings(restaurantID, colors));
    } catch (err) {
      next(err);
    }
  };
}

export default RestaurantController;
