import TagsController from '@controllers/tags.controller';
import TagsService from '@services/tags.service';
import { CreateTagResponseInterface, TagsInterface, TagsModelInterface } from '@/interfaces/tags.interface';
import { NextFunction, Request, Response } from 'express-serve-static-core';

jest.mock('@/services/tags.service', () => {
  const mockTagsService = {
    getCustomTagsAndDefaultTagsByRestaurantID: jest.fn(),
    createRestaurantTag: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTagsService) };
});

const mockTagService = new TagsService({} as TagsModelInterface);
const tagsController = new TagsController(mockTagService);

describe('tagsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getCustomTagsAndDefaultTagsByRestaurantID', () => {
    it('should successfully fetch all tags', async () => {
      const mockTagResults: TagsInterface[] = [
        {
          tagID: 1,
          name: 'Special',
          tagColor: '#FF6937',
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-02T02:44:11.950Z',
        },
        {
          tagID: 2,
          name: 'Chef"s Recommendation',
          tagColor: '#3977EB',
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-02T02:44:11.950Z',
        },
        {
          tagID: 3,
          name: 'New Addition',
          tagColor: '#05944F',
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-02T02:44:11.950Z',
        },
        {
          tagID: 4,
          name: 'Most Popular',
          tagColor: '#19B3D7',
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-02T02:44:11.950Z',
        },
      ];

      (mockTagService.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockTagResults);

      // mock a request needed by controller
      const mReq = {};

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await tagsController.getCustomTagsAndDefaultTagsByRestaurantID(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockTagService.getCustomTagsAndDefaultTagsByRestaurantID).toHaveBeenCalledTimes(1);
    });
    it('should not retrieve tags because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await tagsController.getCustomTagsAndDefaultTagsByRestaurantID(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('createTag', () => {
    it('should successfully create tag', async () => {
      const mockServiceResponse: CreateTagResponseInterface = {
        tagID: 123,
        name: 'testTag',
        color: '#333fff',
      };
      const mReq = {
        body: {
          name: 'testTag',
          color: '#333fff',
        },
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockTagService.createRestaurantTag as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      await tagsController.createRestaurantTag(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockTagService.createRestaurantTag).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create tag because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await tagsController.createRestaurantTag(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockTagService.createRestaurantTag).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
