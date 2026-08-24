import { NextFunction, Request, Response } from 'express-serve-static-core';
import CuisinesService from '@services/cuisines.service';
import { CuisineInterface, CuisinesModelInterface } from '@interfaces/cuisines.interface';
import CuisinesController from '@controllers/cuisines.controller';

jest.mock('@/services/cuisines.service', () => {
  const mockCuisinesService = {
    getAllCuisines: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockCuisinesService) };
});

const mockCuisinesService = new CuisinesService({} as CuisinesModelInterface);
const cuisinesController = new CuisinesController(mockCuisinesService);

describe('cuisinesController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllCuisines', () => {
    it('should successfully fetch all cuisines', async () => {
      const mockCuisineResults: CuisineInterface[] = [
        {
          cuisineID: 1,
          name: 'Italian',
        },
        {
          cuisineID: 2,
          name: 'Mexican',
        },
      ];

      (mockCuisinesService.getAllCuisines as jest.MockedFunction<any>).mockResolvedValueOnce(mockCuisineResults);

      const mReq = {};

      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      await cuisinesController.getAllCuisines(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockCuisinesService.getAllCuisines).toHaveBeenCalledTimes(1);
    });
    it('should not retrieve cuisines because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await cuisinesController.getAllCuisines(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
});
