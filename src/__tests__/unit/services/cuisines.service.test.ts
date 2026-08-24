import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import CuisinesModel from '@/models/cuisines.model';
import CuisinesService from '@services/cuisines.service';
import { CuisineEntity } from '@/entities/cuisine.entity';
import { CuisineInterface } from '@interfaces/cuisines.interface';

jest.mock('@/models/cuisines.model', () => {
  const mockCuisinesModel = {
    getAllCuisines: jest.fn(),
    getCuisineByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockCuisinesModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockCuisinesModel = new CuisinesModel();
const cuisinesService = new CuisinesService(mockCuisinesModel);

describe('cuisinesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllCuisines', () => {
    const mockModelResponse: CuisineEntity[] = [
      {
        cuisine_id: 1,
        name: 'Italian',
        date_created: '2022-02-02T02:44:11.950Z',
        restaurants: [],
      },
    ];
    const expectedResponse: CuisineInterface[] = [
      {
        cuisineID: 1,
        name: 'Italian',
      },
    ];
    it('should successfully get all cuisines in table', async () => {
      (mockCuisinesModel.getAllCuisines as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await cuisinesService.getAllCuisines();
      expect(mockCuisinesModel.getAllCuisines).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw HttpException if HttpException error occurs while getting cuisines', async () => {
      (mockCuisinesModel.getAllCuisines as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await cuisinesService.getAllCuisines();
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCuisinesModel.getAllCuisines).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists while getting cuisines', async () => {
      (mockCuisinesModel.getAllCuisines as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await cuisinesService.getAllCuisines();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCuisinesModel.getAllCuisines).toHaveBeenCalledTimes(1);
    });
  });
  describe('checkIfCuisineExists', () => {
    const mockModelResponse: CuisineEntity[] = [
      {
        cuisine_id: 1,
        name: 'Italian',
        date_created: '2022-02-02T02:44:11.950Z',
      },
    ];
    const CUISINE_ID = 1;
    it('should successfully validate cuisine exists by id and return existing entity', async () => {
      (mockCuisinesModel.getCuisineByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await cuisinesService.checkIfCuisineExists(CUISINE_ID);
      expect(mockCuisinesModel.getCuisineByID).toHaveBeenCalledWith(CUISINE_ID);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw 404 No Content HttpException if cuisine does not exist for provided id', async () => {
      try {
        await cuisinesService.checkIfCuisineExists(CUISINE_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCuisinesModel.getCuisineByID).toHaveBeenCalledWith(CUISINE_ID);
    });
    it('should throw HttpException if HttpException error occurs while validating cuisine exists by id', async () => {
      (mockCuisinesModel.getCuisineByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await cuisinesService.checkIfCuisineExists(CUISINE_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCuisinesModel.getCuisineByID).toHaveBeenCalledWith(CUISINE_ID);
    });
    it('should throw 500 Bad Request HttpException if any error exists while validating cuisine exists by id', async () => {
      (mockCuisinesModel.getCuisineByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await cuisinesService.checkIfCuisineExists(CUISINE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCuisinesModel.getCuisineByID).toHaveBeenCalledWith(CUISINE_ID);
    });
  });
});
