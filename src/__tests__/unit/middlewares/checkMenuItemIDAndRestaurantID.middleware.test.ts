import { NextFunction, Request, Response } from 'express';
import { checkMenuItemIDAndRestaurantIDMiddleware } from '@middlewares/checkMenuItemIDAndRestaurantID.middleware';
import MenuItemModel from '@/models/menuItem.model';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/menuItem.model', () => {
  const mockMenuItemModel = {
    findMenuItemByIDAndRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemModel) };
});

const menuItemModel = new MenuItemModel();
describe('checkMenuItemIDAndRestaurantIDMiddleware', () => {
  const MENU_ID = 123;
  const MENU_ITEM = {
    menu_section_id: {
      menu_id: MENU_ID,
    },
  };
  const mReq: Partial<Request> = {
    body: {
      menuItemID: 1000,
    },
    headers: {
      authorization: 'token',
      restaurantID: '1',
    },
  };
  it('should successfully verify menu item exists for restaurant id provided in request body', async () => {
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();

    (menuItemModel.findMenuItemByIDAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEM);

    await checkMenuItemIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);

    // called with empty parameters specifies that no error was passed
    expect(mNext).toHaveBeenCalledWith();
  });
  it('should successfully verify menu item exists for restaurant id provided in request params', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
      params: {
        menuItemID: '1000',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();

    (menuItemModel.findMenuItemByIDAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEM);

    await checkMenuItemIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);

    // called with empty parameters specifies that no error was passed
    expect(mNext).toHaveBeenCalledWith();
  });
  it('should throw 400 Bad Request if restaurant id not provided when verifying menu item exists for restaurant', async () => {
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: {},
    };
    const mNext = jest.fn();

    (mNext as jest.MockedFunction<any>).mockImplementationOnce(error => {
      expect(error.status).toEqual(400);
    });

    await checkMenuItemIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
  it('should throw 401 Unauthorized if menu item id does not exist for restaurant id provided', async () => {
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();

    (menuItemModel.findMenuItemByIDAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    await checkMenuItemIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    (mNext as jest.MockedFunction<any>).mockImplementationOnce(error => {
      expect(error.status).toEqual(401);
    });
  });

  it('should throw 400 Bad Request if menu item id not provided when verifying menu item for restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
      params: {},
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();
    (mNext as jest.MockedFunction<any>).mockImplementationOnce(error => {
      expect(error.status).toEqual(400);
    });

    await checkMenuItemIDAndRestaurantIDMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
  });
});
