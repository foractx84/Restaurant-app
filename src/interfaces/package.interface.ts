import { NextFunction, Request, Response } from 'express';

export interface PackageControllerInterface {
  assignPackageToRestaurant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface PackageServiceInterface {
  assignPackageToRestaurant: (
    managerID: number,
    managerPackageID: number,
    restaurantID: number,
  ) => Promise<AssignPackageToRestaurantResponseInterface>;
}

export interface PackageDBInterface {
  package_id: number;
  name: string;
  description: string;
  code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  special: boolean;
}

export interface AssignPackageToRestaurantRequestInterface {
  managerPackageID: number;
}

export interface AssignPackageToRestaurantResponseInterface {
  permissionToken: string;
}
