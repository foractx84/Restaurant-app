import { NextFunction, Request, Response } from 'express-serve-static-core';
import { AssignPackageToRestaurantRequestInterface, PackageControllerInterface, PackageServiceInterface } from '@interfaces/package.interface';

class PackageController implements PackageControllerInterface {
  private packageService: PackageServiceInterface;

  constructor(packageService: PackageServiceInterface) {
    this.packageService = packageService;
  }

  assignPackageToRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { managerPackageID } = req.body as AssignPackageToRestaurantRequestInterface;
      const managerID: number = parseInt(res.locals.managerID);
      const restaurantID: number = parseInt(res.locals.restaurantID);
      res.json(await this.packageService.assignPackageToRestaurant(managerID, managerPackageID, restaurantID));
    } catch (err) {
      next(err);
    }
  };
}

export default PackageController;
