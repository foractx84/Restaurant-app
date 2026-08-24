import { HttpException } from '@exceptions/HttpException';
import PackageService from '@services/package.service';
import SubscriptionItemService from '@services/subscriptionItem.service';
import { ProductPriceServiceInterface } from '@interfaces/productPrice.interface';
import { SubscriptionItemModelInterface } from '@interfaces/subscriptionItem.interface';
import { ManagerPackageModelInterface } from '@interfaces/managerPackage.interface';
import { PackagePermissionModelInterface } from '@interfaces/packagePermission.interface';
import { RestaurantPackageModelInterface } from '@interfaces/restaurantPackage.interface';
import ManagerPackageService from '@services/managerPackage.service';
import PackagePermissionService from '@services/packagePermission.service';
import RestaurantPackageService from '@services/restaurantPackages.service';
import { ormConnection } from '@utils/dbUtils';
import { generatePermissionsToken } from '@utils/generateToken';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';

jest.mock('@/services/packagePermission.service', () => {
  const mockPackagePermissionService = {
    getPackagePermissionsByPackageID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockPackagePermissionService) };
});
jest.mock('@/services/managerPackage.service', () => {
  const mockManagerPackageService = {
    checkManagerHasAvailablePackage: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerPackageService) };
});
jest.mock('@/services/restaurantPackages.service', () => {
  const mockRestaurantPackageService = {
    checkRestaurantAlreadyHasPackage: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantPackageService) };
});
jest.mock('@/services/subscriptionItem.service', () => {
  const mockSubscriptionItemService = {
    getSubscriptionItemByStripeCustomerIDAndPackageID: jest.fn(),
    updateSubscriptionItem: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSubscriptionItemService) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/generateToken', () => {
  return { __esModule: true, generatePermissionsToken: jest.fn() };
});

const mockManagerPackageService = new ManagerPackageService({} as ManagerPackageModelInterface);
const mockPackagePermissionService = new PackagePermissionService({} as PackagePermissionModelInterface);
const mockRestaurantPackageService = new RestaurantPackageService({} as RestaurantPackageModelInterface);
const mockSubscriptionItemsService = new SubscriptionItemService({} as ProductPriceServiceInterface, {} as SubscriptionItemModelInterface);

const packageService = new PackageService(
  mockManagerPackageService,
  mockPackagePermissionService,
  mockRestaurantPackageService,
  mockSubscriptionItemsService,
);

describe('packageService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const MOCK_TOKEN = {
    permissionToken: 'permission_token',
  };

  describe('assignPackageToRestaurant', () => {
    const RESTAURANT_ID = 1;
    const MANAGER_ID = 2;
    const PACKAGE_ID = 3;
    const MANAGER_PACKAGE_ID = 4;
    const mockManagerPackageEntity: ManagerPackageEntity = {
      external_user_id: MANAGER_ID,
      package_id: PACKAGE_ID,
      manager_package_id: MANAGER_PACKAGE_ID,
    };
    it('should assign package to restaurant', async () => {
      (mockManagerPackageService.checkManagerHasAvailablePackage as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerPackageEntity);
      (mockRestaurantPackageService.checkRestaurantAlreadyHasPackage as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (generatePermissionsToken as jest.MockedFunction<any>).mockImplementation(() => MOCK_TOKEN.permissionToken);

      const result = await packageService.assignPackageToRestaurant(MANAGER_ID, MANAGER_PACKAGE_ID, RESTAURANT_ID);

      expect(mockManagerPackageService.checkManagerHasAvailablePackage).toHaveBeenCalledWith(MANAGER_ID, MANAGER_PACKAGE_ID);
      expect(mockRestaurantPackageService.checkRestaurantAlreadyHasPackage).toHaveBeenCalledWith(PACKAGE_ID, RESTAURANT_ID);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MOCK_TOKEN);
    });
    it('should throw a HttpException 500 if any error occurs while attempting assigning package to restaurant', async () => {
      (mockManagerPackageService.checkManagerHasAvailablePackage as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await packageService.assignPackageToRestaurant(MANAGER_ID, MANAGER_PACKAGE_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
