import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import ManagerRestaurantModel from '@/models/managerRestaurant.model';
import ManagerRestaurantService from '@/services/managerRestaurant.service';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/managerRestaurant.model', () => {
  const mockManagerRestaurantModel = {
    insertManagerRestaurantEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerRestaurantModel) };
});

const mockManagerRestaurantModel = new ManagerRestaurantModel();
const managerRestaurantService = new ManagerRestaurantService(mockManagerRestaurantModel);

describe('managerRestaurantService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('insertManagerRestaurantEntity', () => {
    const MANAGER_ID = 2;
    const RESTAURANT_ID = 1;
    it('should successfully insert manager with restaurant ', async () => {
      await managerRestaurantService.insertManagerRestaurantEntity(MANAGER_ID, RESTAURANT_ID, {} as EntityManager);

      expect(mockManagerRestaurantModel.insertManagerRestaurantEntity).toHaveBeenCalledWith(MANAGER_ID, RESTAURANT_ID, {} as EntityManager);
    });
    it('should throw HttpException if HttpException error occurs while inserting manager with restaurant', async () => {
      (mockManagerRestaurantModel.insertManagerRestaurantEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await managerRestaurantService.insertManagerRestaurantEntity(MANAGER_ID, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagerRestaurantModel.insertManagerRestaurantEntity).toHaveBeenCalledWith(MANAGER_ID, RESTAURANT_ID, {} as EntityManager);
    });
    it('should throw 500 Bad Request HttpException if any error exists while inserting manager with restaurant', async () => {
      (mockManagerRestaurantModel.insertManagerRestaurantEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managerRestaurantService.insertManagerRestaurantEntity(MANAGER_ID, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagerRestaurantModel.insertManagerRestaurantEntity).toHaveBeenCalledWith(MANAGER_ID, RESTAURANT_ID, {} as EntityManager);
    });
  });
});
