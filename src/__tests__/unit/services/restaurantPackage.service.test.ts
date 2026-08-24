import { TapManagerError } from '@exceptions/HttpException';
import RestaurantPackageModel from '@/models/restaurantPackage.model';
import RestaurantPackageService from '@/services/restaurantPackages.service';
import { RestaurantPackageEntity } from '@/entities/restaurantPackage.entity';
import { EntityManager } from 'typeorm';

jest.mock('@/models/restaurantPackage.model', () => {
  const mockRestaurantPackageModel = {
    getRestaurantPackageByPackageIDAndRestaurantID: jest.fn(),
    insertRestaurantPackageEntity: jest.fn(),
    deactivateRestaurantPackage: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantPackageModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockRestaurantPackageModel = new RestaurantPackageModel();
const restaurantPackageService = new RestaurantPackageService(mockRestaurantPackageModel);

describe('RestaurantPackageService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkRestaurantAlreadyHasPackage', () => {
    const RESTAURANT_ID = 1;
    const PACKAGE_ID = 2;
    const RESTAURANT_PACKAGE_ID = 3;
    const mockRestaurantPackageEntity: RestaurantPackageEntity = {
      restaurant_id: RESTAURANT_ID,
      package_id: PACKAGE_ID,
      restaurant_package_id: RESTAURANT_PACKAGE_ID,
    };
    it('should not throw exception since package for restaurant does not exist', async () => {
      (mockRestaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await restaurantPackageService.checkRestaurantAlreadyHasPackage(PACKAGE_ID, RESTAURANT_ID);

      expect(mockRestaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID).toHaveBeenCalledWith(PACKAGE_ID, RESTAURANT_ID);
    });
    it('should throw 409 HttpException error occurs if restaurant already has this specific package', async () => {
      (mockRestaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockRestaurantPackageEntity,
      );

      try {
        await restaurantPackageService.checkRestaurantAlreadyHasPackage(PACKAGE_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID).toHaveBeenCalledWith(PACKAGE_ID, RESTAURANT_ID);
    });
    it('should throw 500 Bad Request HttpException if any error exists while checking restaurant has specific package', async () => {
      (mockRestaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantPackageService.checkRestaurantAlreadyHasPackage(PACKAGE_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID).toHaveBeenCalledWith(PACKAGE_ID, RESTAURANT_ID);
    });
  });
  describe('createRestaurantPackage', () => {
    const RESTAURANT_ID = 1;
    const PACKAGE_ID = 2;
    const mockRestaurantPackageEntity: RestaurantPackageEntity = {
      package_id: PACKAGE_ID,
      restaurant_id: RESTAURANT_ID,
    };
    it('should successfully create restaurant package', async () => {
      await restaurantPackageService.createRestaurantPackage(PACKAGE_ID, RESTAURANT_ID);

      expect(mockRestaurantPackageModel.insertRestaurantPackageEntity).toHaveBeenCalledWith(mockRestaurantPackageEntity);
    });
    it('should throw 500 Bad Request HttpException if any error exists while creating package for restaurant', async () => {
      (mockRestaurantPackageModel.insertRestaurantPackageEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantPackageService.createRestaurantPackage(PACKAGE_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantPackageModel.insertRestaurantPackageEntity).toHaveBeenCalledWith(mockRestaurantPackageEntity);
    });
  });
  describe('deactivateRestaurantPackage', () => {
    const RESTAURANT_PACKAGE_ID = 1;
    it('should successfully set restaurant packages to inactive', async () => {
      await restaurantPackageService.deactivateRestaurantPackage(RESTAURANT_PACKAGE_ID, {} as EntityManager);

      expect(mockRestaurantPackageModel.deactivateRestaurantPackage).toHaveBeenCalledWith(RESTAURANT_PACKAGE_ID, {});
    });
    it('should throw 500 Bad Request HttpException if any error exists while setting restaurant package to inactive', async () => {
      (mockRestaurantPackageModel.deactivateRestaurantPackage as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantPackageService.deactivateRestaurantPackage(RESTAURANT_PACKAGE_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
