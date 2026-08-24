import FontsController from '@controllers/fonts.controller';
import { FontsModelInterface, GetFontsResponseInterface } from '@/interfaces/fonts.interface';
import { FontCategory } from '@/enums/fontCategory';
import FontsService from '@/services/fonts.service';
import { NextFunction, Request, Response } from 'express-serve-static-core';

jest.mock('@/services/fonts.service', () => {
  const mockFontsService = {
    getFonts: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockFontsService) };
});

const mockFontsService = new FontsService({} as FontsModelInterface);
const fontsController = new FontsController(mockFontsService);

describe('fontsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getFonts', () => {
    it('should return the fonts allowlist', async () => {
      const mockResponse: GetFontsResponseInterface = {
        fonts: [
          {
            title: 'Inter',
            category: FontCategory.SANS,
            usageNotes: 'Nav, buttons, checkout, menu line items',
            listOrder: 1,
          },
        ],
      };

      (mockFontsService.getFonts as jest.MockedFunction<any>).mockResolvedValueOnce(mockResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await fontsController.getFonts({} as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockFontsService.getFonts).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockResponse);
    });

    it('should call next when the service throws', async () => {
      const err = new Error('service error');
      (mockFontsService.getFonts as jest.MockedFunction<any>).mockRejectedValueOnce(err);

      const mNext = jest.fn();
      const mRes: Partial<Response> = { json: jest.fn() };
      await fontsController.getFonts({} as Request, mRes as Response, mNext as NextFunction);

      expect(mockFontsService.getFonts).toHaveBeenCalledTimes(1);
      expect(mNext).toHaveBeenCalledWith(err);
    });
  });
});
