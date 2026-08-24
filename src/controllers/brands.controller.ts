import { NextFunction, Request, Response } from 'express-serve-static-core';
import BrandsService from '@services/brands.service';
import { CreateBrandDto, EditBrandDto } from '@dtos/brand.dto';
import { deleteImageIfExists } from '@utils/imageUtils';

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
      const brandRequest = req.body as CreateBrandDto;

      res.status(201).json(await this.brandsService.createBrand(restaurantGroupID, brandRequest));
    } catch (err) {
      next(err);
    }
  };

  updateBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandID = req.params.brandID;
      const brandRequest = req.body as EditBrandDto;

      await this.brandsService.updateBrand(brandID, brandRequest);

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  uploadBrandLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const logoImage = files?.['logo']?.[0];

    try {
      const brandID = req.params.brandID;

      if (!logoImage) {
        res.status(400).json({
          message: 'Logo image is required.',
        });
        return;
      }

      const previousLogoUrl = await this.brandsService.updateBrandLogo(brandID, logoImage.filename);

      if (previousLogoUrl && previousLogoUrl !== logoImage.filename) {
        await deleteImageIfExists(previousLogoUrl);
      }

      res.status(200).json({
        logoUrl: logoImage.filename,
      });
    } catch (err) {
      if (logoImage) {
        await deleteImageIfExists(logoImage.filename);
      }

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
