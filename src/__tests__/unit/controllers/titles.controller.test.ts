import { NextFunction, Request, Response } from 'express-serve-static-core';
import TitlesService from '@services/titles.service';
import { GetTitlesResponseInterface, TitlesModelInterface } from '@interfaces/titles.interface';
import TitlesController from '@controllers/titles.controller';

jest.mock('@/services/titles.service', () => {
  const mockTitlesService = {
    getTitles: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTitlesService) };
});

const mockTitlesService = new TitlesService({} as TitlesModelInterface);
const titlesController = new TitlesController(mockTitlesService);

describe('titlesController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTitles', () => {
    it('should successfully fetch all titles', async () => {
      const mockTitlesResults: GetTitlesResponseInterface = {
        titles: [
          {
            titleID: 1,
            name: 'Owner',
          },
          {
            titleID: 2,
            name: 'Manager',
          },
        ],
      };
      (mockTitlesService.getTitles as jest.MockedFunction<any>).mockResolvedValueOnce(mockTitlesResults);

      const mReq = {};
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      await titlesController.getTitles(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockTitlesService.getTitles).toHaveBeenCalledTimes(1);
    });
    it('should not retrieve titles because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await titlesController.getTitles(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
});
