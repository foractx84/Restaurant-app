import { TagsDBInterface } from '@/interfaces/tags.interface';
import { checkTagNameAndColorAndRestaurantID } from '@/middlewares/tags.middleware';
import TagsModel from '@/models/tags.model';
import { NextFunction, Request, Response } from 'express';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/tags.model', () => {
  const mockTagsModel = {
    getTagByNameAndColorAndRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTagsModel) };
});

const tagsModel = new TagsModel();
describe('tagsMiddleware', () => {
  describe('checkTagNameAndColorAndRestaurantID', () => {
    const mReq: Partial<Request> = {
      body: {
        name: 'name of tag',
        color: '#333fff',
      },
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mockedFindOneResponse: TagsDBInterface = {
      tag_id: 123,
      name: 'name of tag',
      color: '#333fff',
      restaurant_id: 1,
      created_at: '2022-07-02T02:44:11.950Z',
      updated_at: '2022-07-02T02:44:11.950Z',
    };
    it('should successfully verify if other tags do not have the same name and color value for restaurant', async () => {
      const mNext = jest.fn();
      (tagsModel.getTagByNameAndColorAndRestaurantID as jest.MockedFunction<any>).mockResolvedValue(undefined);
      await checkTagNameAndColorAndRestaurantID(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 Resource Conflict if other tag has the same name and color for restaurant', async () => {
      const mNext = jest.fn();
      (mNext as jest.MockedFunction<any>).mockImplementation(err => {
        expect(err.status).toEqual(409);
      });
      (tagsModel.getTagByNameAndColorAndRestaurantID as jest.MockedFunction<any>).mockResolvedValue(mockedFindOneResponse);
      await checkTagNameAndColorAndRestaurantID(mReq as Request, mRes as Response, mNext as NextFunction);
    });
  });
});
