import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';
import RestaurantProfileMediaModel from '@/models/restaurantProfileMedia.model';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';

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

const restaurantProfileMediaModel = new RestaurantProfileMediaModel();

describe('RestaurantProfileMediaModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('insertRestaurantProfileMediaForPageSection', () => {
    const SECTION_ID = 1;
    const restaurantProfileMediaEntities: RestaurantProfileMediaEntity[] = [
      new RestaurantProfileMediaEntity(SECTION_ID, 1, null, 0),
      new RestaurantProfileMediaEntity(SECTION_ID, 2, null, 1),
    ];
    it('should successfully insert restaurant profile media for page section', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      await restaurantProfileMediaModel.insertRestaurantProfileMediaForPageSection(restaurantProfileMediaEntities);

      expect(save).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant profile albums by restaurant id', async () => {
      const insert = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileMediaModel.insertRestaurantProfileMediaForPageSection(restaurantProfileMediaEntities);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(insert).not.toHaveBeenCalled();
    });
  });
  describe('softDeleteRestaurantProfileMediaBySectionID', () => {
    const SECTION_ID = 1;
    it('should successfully soft delete restaurant profile media by sectionID', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await restaurantProfileMediaModel.softDeleteRestaurantProfileMediaBySectionID(SECTION_ID);

      expect(update).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when deleting restaurant profile media by sectionID', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileMediaModel.softDeleteRestaurantProfileMediaBySectionID(SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
    });
  });
});
