import { ormConnection } from '@utils/dbUtils';
import TagsModel from '@/models/tags.model';
import { TagsEntity } from '@/entities/tags.entity';
import { TapManagerError } from '@exceptions/HttpException';
import { TagsDBInterface } from '@/interfaces/tags.interface';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const tagsModel = new TagsModel();
describe('tagsModel', () => {
  describe('insertTag', () => {
    const tagEntity = new TagsEntity();
    tagEntity.name = 'name of tag';
    tagEntity.color = '#333fff';
    tagEntity.restaurant_id = 1;
    it('should insert new tag', async () => {
      const mockedInsertResponse: TagsDBInterface = {
        tag_id: 123,
        name: 'name of tag',
        color: '#333fff',
        restaurant_id: 1,
        created_at: '2022-07-02T02:44:11.950Z',
        updated_at: '2022-07-02T02:44:11.950Z',
      };
      const mockedInsert = jest.fn().mockResolvedValue({ raw: [mockedInsertResponse] });
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      const result = await tagsModel.insertTag(tagEntity);
      expect(mockedInsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockedInsertResponse);
    });
    it('should throw HttpException 500 if an error occurs while create tag', async () => {
      const mockedInsert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      try {
        await tagsModel.insertTag(tagEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getTagByNameAndColorAndRestaurantID', () => {
    const tagName = 'name of tag';
    const tagColor = '#333fff';
    const restaurantID = 1;
    it('shoud find tag by name, color and restaurant id successfully', async () => {
      const mockedFindOneResponse: TagsDBInterface = {
        tag_id: 123,
        name: 'name of tag',
        color: '#333fff',
        restaurant_id: 1,
        created_at: '2022-07-02T02:44:11.950Z',
        updated_at: '2022-07-02T02:44:11.950Z',
      };
      const mockedFindOne = jest.fn().mockResolvedValue(mockedFindOneResponse);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne: mockedFindOne,
      });
      const result = await tagsModel.getTagByNameAndColorAndRestaurantID(restaurantID, tagName, tagColor);
      expect(result).toEqual(mockedFindOneResponse);
    });
    it('should throw HttpException 500 if an error occurs', async () => {
      const mockedFindOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne: mockedFindOne,
      });
      try {
        await tagsModel.getTagByNameAndColorAndRestaurantID(restaurantID, tagName, tagColor);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getCustomTagsAndDefaultTagsByRestaurantID', () => {
    const restaurantID = 1;
    it('should successfully get tags', async () => {
      const expectedResponse: TagsDBInterface[] = [
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
          name: 'Chef" Recommendation',
          color: '#3977EB',
          restaurant_id: null,
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
        },
        {
          tag_id: 3,
          name: 'test tag',
          color: '#05944F',
          restaurant_id: 1,
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
        },
      ];
      const mockedFind = jest.fn().mockResolvedValueOnce(expectedResponse);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find: mockedFind,
      });
      const result = await tagsModel.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw HttpException 500 if an error occurs', async () => {
      const mockedFind = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find: mockedFind,
      });

      try {
        await tagsModel.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
      expect(mockedFind).toHaveBeenCalledTimes(1);
    });
  });
});
