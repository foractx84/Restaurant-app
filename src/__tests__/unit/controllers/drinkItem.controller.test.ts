import { NextFunction, Request, Response } from 'express-serve-static-core';
import DrinkItemService from '@services/drinkItem.service';
import { DrinkItemModelInterface, GetDrinkItemsInterface } from '@interfaces/drinkItem.interface';
import DrinkItemController from '@controllers/drinkItem.controller';

jest.mock('@/services/drinkItem.service', () => {
  const mockDrinkItemService = {
    getDrinkItemsByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDrinkItemService) };
});

// mock menus service object
const mockDrinkItemService = new DrinkItemService({} as DrinkItemModelInterface);

// create test controller object
const drinkItemController = new DrinkItemController(mockDrinkItemService);

describe('drinkItemController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDrinkItems', () => {
    it('should successfully get drink items for restaurant', async () => {
      let responseObject;
      const response: GetDrinkItemsInterface[] = [
        {
          name: 'Drink Item 1',
          drinkItemID: 1,
          isHidden: false,
        },
        {
          name: 'Drink Item 2',
          drinkItemID: 2,
          isHidden: false,
        },
      ];
      // mock a request needed by controller
      const mReq = {} as unknown;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };

      (mockDrinkItemService.getDrinkItemsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(response);

      await drinkItemController.getDrinkItems(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockDrinkItemService.getDrinkItemsByRestaurantID).toHaveBeenCalledWith(1);
      expect(responseObject).toEqual(response);
    });
    it('should not get drink items for restaurant because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await drinkItemController.getDrinkItems(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDrinkItemService.getDrinkItemsByRestaurantID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
