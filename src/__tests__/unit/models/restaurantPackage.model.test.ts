import RestaurantPackageModel from '@/models/restaurantPackage.model';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const restaurantPackageModel = new RestaurantPackageModel();

describe('RestaurantPackageModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('getRestaurantPackageByPackageIDAndRestaurantID', () => {
    const PACKAGE_ID = 2;
    const RESTAURANT_ID = 1;
    it('should successfully get restaurant package', async () => {
      const findOne = jest.fn();

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await restaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID(PACKAGE_ID, RESTAURANT_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting restaurant package', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        findOne,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await restaurantPackageModel.getRestaurantPackageByPackageIDAndRestaurantID(PACKAGE_ID, RESTAURANT_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(findOne).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertRestaurantPackageEntity', () => {
    const PACKAGE_ID = 2;
    const RESTAURANT_ID = 1;
    const restaurantPackageEntity = {
      package_id: PACKAGE_ID,
      restaurant_id: RESTAURANT_ID,
    };
    it('should successfully insert restaurant package', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: [restaurantPackageEntity] });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      await restaurantPackageModel.insertRestaurantPackageEntity(restaurantPackageEntity);

      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting restaurant package', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await restaurantPackageModel.insertRestaurantPackageEntity(restaurantPackageEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('deactivateRestaurantPackage', () => {
    const RESTAURANT_PACKAGE_ID = 1;
    it('should successfully update restaurant package to be inactive (is_active = false)', async () => {
      const execute = jest.fn();
      const where = jest.fn(() => ({ execute }));
      const set = jest.fn(() => ({ where }));
      const update = jest.fn(() => ({ set }));

      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: () => REPOSITORY,
      });

      await restaurantPackageModel.deactivateRestaurantPackage(RESTAURANT_PACKAGE_ID);

      expect(execute).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating restaurant package to inactive', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await restaurantPackageModel.deactivateRestaurantPackage(RESTAURANT_PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
