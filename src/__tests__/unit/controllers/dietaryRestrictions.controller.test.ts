import DietaryRestrictionsController from '@controllers/dietaryRestrictions.controller';
import DietaryRestrictionsService from '@services/dietaryRestrictions.service';
import { DietaryRestrictionsModelInterface } from '@/interfaces/dietaryRestrictions.interface';
import { NextFunction, Request, Response } from 'express-serve-static-core';

jest.mock('@/services/dietaryRestrictions.service', () => {
  const mockDietaryRestrictionsService = {
    getAllRestrictions: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDietaryRestrictionsService) };
});

const mockDietaryRestrictionsService = new DietaryRestrictionsService({} as DietaryRestrictionsModelInterface);
const dietaryRestrictionsController = new DietaryRestrictionsController(mockDietaryRestrictionsService);

describe('dietaryRestrictionsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllRestrictions', () => {
    it('should successfully fetch all dietary restrictions', async () => {
      const mockDietaryRestrictionsResults = [
        {
          restrictionID: 1,
          name: 'Beef',
        },
        {
          restrictionID: 3,
          name: 'Chicken',
        },
        {
          restrictionID: 8,
          name: 'Eggs',
        },
        {
          restrictionID: 4,
          name: 'Fish',
        },
        {
          restrictionID: 7,
          name: 'Lactose',
        },
        {
          restrictionID: 9,
          name: 'Nuts',
        },
        {
          restrictionID: 2,
          name: 'Pork',
        },
        {
          restrictionID: 5,
          name: 'Shellfish',
        },
        {
          restrictionID: 6,
          name: 'Gluten',
        },
      ];

      (mockDietaryRestrictionsService.getAllRestrictions as jest.MockedFunction<any>).mockResolvedValueOnce(mockDietaryRestrictionsResults);

      // mock a request needed by controller
      const mReq = {};

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await dietaryRestrictionsController.getAllRestrictions(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockDietaryRestrictionsService.getAllRestrictions).toHaveBeenCalledTimes(1);
    });
    it('should not retrieve dietary restrictions because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await dietaryRestrictionsController.getAllRestrictions(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
});
