import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import RestaurantImagesModel from '@/models/restaurantImages.model';

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

const restaurantImagesModel = new RestaurantImagesModel();

describe('restaurantImagesModel', () => {
  const RESTAURANT_ID = 1;
  const IMAGE_NAME = 'test_url.png';
  const IMAGE_ENTITY = {
    restaurant_id: RESTAURANT_ID,
    image_url: IMAGE_NAME,
    restaurant_image_type_id: 1,
  };
  const IMAGE_ENTITY_RESPONSE = {
    restaurant_image_id: 1,
    restaurant_id: RESTAURANT_ID,
    image_url: IMAGE_NAME,
    restaurant_image_type_id: 1,
    list_order: 0,
  };
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('findRestaurantImageEntitiesByRestaurantID', () => {
    it('should successfully return restaurant images by restaurant id', async () => {
      const mockQueryResponse = [IMAGE_ENTITY_RESPONSE];

      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(mockQueryResponse);

      const result = await restaurantImagesModel.findRestaurantImageEntitiesByRestaurantID(RESTAURANT_ID);

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockQueryResponse);
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant images by restaurant id', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantImagesModel.findRestaurantImageEntitiesByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('softDeleteRestaurantImages', () => {
    const IMAGE_IDS = [1, 2];
    it('should successfully mark restaurant images as deleted', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await restaurantImagesModel.softDeleteRestaurantImages(IMAGE_IDS, RESTAURANT_ID);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when marking restaurant images as deleted', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantImagesModel.softDeleteRestaurantImages(IMAGE_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertImages', () => {
    it('should successfully insert restaurant images', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: [IMAGE_ENTITY_RESPONSE] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };

      const result = await restaurantImagesModel.insertImages([IMAGE_ENTITY], REPOSITORY);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual([IMAGE_ENTITY_RESPONSE]);
    });
    it('should throw 500 HttpException if any error occurs when inserting restaurant image', async () => {
      const REPOSITORY: any = {
        getCustomRepository: () => {
          throw Error;
        },
      };

      try {
        await restaurantImagesModel.insertImages([IMAGE_ENTITY], REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
