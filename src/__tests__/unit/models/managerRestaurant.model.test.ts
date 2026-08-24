import ManagerRestaurantModel from '@/models/managerRestaurant.model';
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

const managerRestaurantModel = new ManagerRestaurantModel();

describe('managerRestaurantModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('insertManagerRestaurantEntity', () => {
    const MANAGER_ID = 2;
    const RESTAURANT_ID = 1;
    it('should insert manager with restaurant entity successfully', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      await managerRestaurantModel.insertManagerRestaurantEntity(MANAGER_ID, RESTAURANT_ID, REPOSITORY as EntityManager);

      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting manager with restaurant entity', async () => {
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
        await managerRestaurantModel.insertManagerRestaurantEntity(MANAGER_ID, RESTAURANT_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
});
