import { HttpException } from '@exceptions/HttpException';
import ProfileCardsModel from '@/models/profileCards.model';
import checkPageSectionCardIDAndRestaurantID from '@/middlewares/checkPageSectionCardIDAndRestaurantID.middleware';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { Response, NextFunction, Request } from 'express';

jest.mock('@utils/logger', () => {
  return { __esModule: true, logger: { error: jest.fn() } };
});

jest.mock('@models/profileCards.model', () => {
  const mockProfileCardsModel = {
    fetchPageSectionCardByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileCardsModel) };
});

const mockProfileCardsModel = new ProfileCardsModel();

describe('checkPageSectionCardIDAndRestaurantID Middleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  const CARD_ID = 1;
  const RESTAURANT_ID = 2;

  it('should successfully validate page section card and restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        cardID: CARD_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };

    const mRes: Partial<Response> = {
      locals: { restaurantID: 1 },
    };

    const mNext = jest.fn();

    const card = {
      section: {
        profilePage: {
          restaurantID: RESTAURANT_ID,
        },
      },
    };
    (mockProfileCardsModel.fetchPageSectionCardByID as jest.MockedFunction<any>).mockResolvedValueOnce(card);

    await checkPageSectionCardIDAndRestaurantID(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 error if cardID is missing', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };

    const mRes: Partial<Response> = {
      locals: { restaurantID: 1 },
    };

    const mNext = jest.fn();

    try {
      await checkPageSectionCardIDAndRestaurantID(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 error if restaurantID is missing', async () => {
    const mReq: Partial<Request> = {
      body: {
        cardID: CARD_ID,
      },
      headers: {
        authorization: 'token',
      },
    };

    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    const mNext = jest.fn();

    try {
      await checkPageSectionCardIDAndRestaurantID(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 error if profile card does not exist', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };

    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    const mNext = jest.fn();

    (mockProfileCardsModel.fetchPageSectionCardByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    try {
      await checkPageSectionCardIDAndRestaurantID(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 error if card does not belong to the provided restaurantID', async () => {
    const mReq = {
      body: { cardID: CARD_ID },
    };

    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    const mNext = jest.fn();

    const card = {
      section: {
        profilePage: {
          restaurantID: 999,
        },
      },
    };

    (mockProfileCardsModel.fetchPageSectionCardByID as jest.MockedFunction<any>).mockResolvedValueOnce(card);

    try {
      await checkPageSectionCardIDAndRestaurantID(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
