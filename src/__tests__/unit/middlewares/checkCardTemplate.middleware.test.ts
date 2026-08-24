import { HttpException } from '@exceptions/HttpException';
import ProfileCardsModel from '@/models/profileCards.model';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { Response, NextFunction, Request } from 'express';
import { checkCardTemplate } from '@/middlewares/checkCardTemplate.middleware';

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

describe('checkCardTemplate Middleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  const CARD_ID = 1;
  const RESTAURANT_ID = 2;

  it('should sucessfully validate card section template is valid and allows for cards', async () => {
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
      locals: { restaurantID: RESTAURANT_ID },
    };

    const mNext = jest.fn();

    const card = {
      section: {
        sectionTemplate: {
          template: 'content_cards',
        },
      },
    };

    (mockProfileCardsModel.fetchPageSectionCardByID as jest.MockedFunction<any>).mockResolvedValueOnce(card);

    await checkCardTemplate(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);

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
      await checkCardTemplate(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
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
      await checkCardTemplate(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
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
      await checkCardTemplate(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 error if card does not belong to the provided restaurantID', async () => {
    const mReq = {
      body: { cardID: 9 },
    };

    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    const mNext = jest.fn();

    const card = {
      section: {
        sectionTemplate: {
          template: 'copy',
        },
      },
    };

    (mockProfileCardsModel.fetchPageSectionCardByID as jest.MockedFunction<any>).mockResolvedValueOnce(card);

    try {
      await checkCardTemplate(mReq as CustomRequest<ProfileCardsEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
