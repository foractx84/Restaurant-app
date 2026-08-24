import { ormConnection } from '@utils/dbUtils';
import { TapManagerError } from '@exceptions/HttpException';
import CuisinesModel from '@/models/cuisines.model';
import { CuisineEntity } from '@/entities/cuisine.entity';

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

const cuisinesModel = new CuisinesModel();
describe('cuisinesModel', () => {
  describe('getAllCuisines', () => {
    const mockModelResponse: CuisineEntity[] = [
      {
        cuisine_id: 1,
        name: 'Italian',
        date_created: '2022-02-02T02:44:11.950Z',
        restaurants: [],
      },
    ];
    it('should get all cuisines successfully', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await cuisinesModel.getAllCuisines();

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting cuisines', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await cuisinesModel.getAllCuisines();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getCuisineByID', () => {
    const mockModelResponse: CuisineEntity[] = [
      {
        cuisine_id: 1,
        name: 'Italian',
        date_created: '2022-02-02T02:44:11.950Z',
      },
    ];
    const CUISINE_ID = 1;
    it('should get cuisine by id successfully', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await cuisinesModel.getCuisineByID(CUISINE_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting cuisine by id', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await cuisinesModel.getCuisineByID(CUISINE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
