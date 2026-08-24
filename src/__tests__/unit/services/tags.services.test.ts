import TagsService from '@services/tags.service';
import TagsModel from '@/models/tags.model';
import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import { CreateTagRequestInterface, CreateTagResponseInterface, TagsDBInterface, TagsInterface } from '@/interfaces/tags.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/tags.model', () => {
  const mockTagsModel = {
    findTagsByIDs: jest.fn(),
    getCustomTagsAndDefaultTagsByRestaurantID: jest.fn(),
    insertTag: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTagsModel) };
});

const mockTagsModel = new TagsModel();
const tagsService = new TagsService(mockTagsModel);

describe('tagsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const restaurantID = 1;

  describe('getCustomTagsAndDefaultTagsByRestaurantID', () => {
    const mockModelResponse: TagsDBInterface[] = [
      {
        tag_id: 1,
        name: 'Special',
        color: '#FF6937',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 2,
        name: 'Chef"s Recommendation',
        color: '#3977EB',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 3,
        name: 'New Addition',
        color: '#05944F',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 4,
        name: 'Most Popular',
        color: '#19B3D7',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 5,
        name: 'test tag',
        color: '#19B3D7',
        restaurant_id: 1,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
    ];
    const mockServiceResponse: TagsInterface[] = [
      {
        tagID: 1,
        name: 'Special',
        tagColor: '#FF6937',
      },
      {
        tagID: 2,
        name: 'Chef"s Recommendation',
        tagColor: '#3977EB',
      },
      {
        tagID: 3,
        name: 'New Addition',
        tagColor: '#05944F',
      },
      {
        tagID: 4,
        name: 'Most Popular',
        tagColor: '#19B3D7',
      },
      {
        tagID: 5,
        name: 'test tag',
        tagColor: '#19B3D7',
      },
    ];
    it('should successfully get custom tags and default tags for restaurant', async () => {
      (mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await tagsService.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
      expect(mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await tagsService.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID).toHaveBeenCalledTimes(1);
    });
    it('should throw 400 Missing Input HttpException', async () => {
      (mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await tagsService.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0]['code']).toEqual(2222);
      }
    });
  });

  describe('createRestaurantTag', () => {
    const tag: CreateTagRequestInterface = {
      name: 'testTag',
      color: '#333fff',
    };
    it('should successfully create tag', async () => {
      const mockModelResponse: TagsDBInterface = {
        tag_id: 123,
        name: 'testTag',
        color: '#333fff',
        restaurant_id: 1,
        created_at: '2022-02-15T01:14:31.847Z',
        updated_at: '2022-02-15T01:14:31.847Z',
      };
      const mockServiceResponse: CreateTagResponseInterface = {
        tagID: 123,
        name: 'testTag',
        color: '#333fff',
      };
      (mockTagsModel.insertTag as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      const result = await tagsService.createRestaurantTag(tag, restaurantID);
      expect(mockTagsModel.insertTag).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });
    it('should throw 500 HttpException if any error exists', async () => {
      (mockTagsModel.insertTag as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await tagsService.createRestaurantTag(tag, restaurantID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('validateTagsByRestaurantID', () => {
    const mockModelResponse: TagsDBInterface[] = [
      {
        tag_id: 1,
        name: 'Special',
        color: '#FF6937',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 2,
        name: 'Chef"s Recommendation',
        color: '#3977EB',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 3,
        name: 'New Addition',
        color: '#05944F',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 4,
        name: 'Most Popular',
        color: '#19B3D7',
        restaurant_id: null,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        tag_id: 5,
        name: 'test tag',
        color: '#19B3D7',
        restaurant_id: 1,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
    ];
    it('should validate tag for a restaurant successfully', async () => {
      const tags = [5];
      (mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      await tagsService.validateTagsByRestaurantID(tags, restaurantID);

      expect(mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID).toHaveBeenCalledTimes(1);
    });
    it('should throw 400 HttpException when validating a tag not existing for a restaurant', async () => {
      const tags = [7];
      (mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      try {
        await tagsService.validateTagsByRestaurantID(tags, restaurantID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 500 HttpException if any error exists', async () => {
      const tags = [5];
      (mockTagsModel.getCustomTagsAndDefaultTagsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await tagsService.validateTagsByRestaurantID(tags, restaurantID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
