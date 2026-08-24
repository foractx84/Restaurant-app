import { NextFunction, Request, Response } from 'express-serve-static-core';
import PackageService from '@services/package.service';
import { ManagerPackageServiceInterface } from '@interfaces/managerPackage.interface';
import { PackagePermissionServiceInterface } from '@interfaces/packagePermission.interface';
import { RestaurantPackageServiceInterface } from '@interfaces/restaurantPackage.interface';
import { SubscriptionItemServiceInterface } from '@interfaces/subscriptionItem.interface';
import PackageController from '@controllers/package.controller';

jest.mock('@/services/package.service', () => {
  const mockPackageService = {
    assignPackageToRestaurant: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockPackageService) };
});

const mockPackageService = new PackageService(
  {} as ManagerPackageServiceInterface,
  {} as PackagePermissionServiceInterface,
  {} as RestaurantPackageServiceInterface,
  {} as SubscriptionItemServiceInterface,
);
const packageController = new PackageController(mockPackageService);

describe('packageController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('assignPackageToRestaurant', () => {
    const MANAGER_ID = 1;
    const RESTAURANT_ID = 2;
    const MANAGER_PACKAGE_ID = 3;
    const mReq = {
      body: {
        managerPackageID: MANAGER_PACKAGE_ID,
      },
    };
    it('should successfully assign package to restaurant', async () => {
      (mockPackageService.assignPackageToRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce({ permissionToken: 'mockToken' });
      const mRes: Partial<Response> = {
        locals: { managerID: MANAGER_ID, restaurantID: RESTAURANT_ID },
      };

      await packageController.assignPackageToRestaurant(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockPackageService.assignPackageToRestaurant).toHaveBeenCalledWith(MANAGER_ID, MANAGER_PACKAGE_ID, RESTAURANT_ID);
    });
    it('should not assign package to restaurant because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await packageController.assignPackageToRestaurant(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockPackageService.assignPackageToRestaurant).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
