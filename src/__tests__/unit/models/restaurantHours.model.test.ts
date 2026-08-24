import { ormConnection, rawQuery } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import RestaurantHoursModel from '@/models/restaurantHours.model';
import { Day } from '@/enums/day';

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
    rawQuery: jest.fn(),
    ormConnection: jest.fn(),
  };
});

const restaurantHoursModel = new RestaurantHoursModel();

describe('restaurantHoursModel', () => {
  afterEach(() => {
    (rawQuery as jest.MockedFunction<any>).mockReset();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const RESTAURANT_ID = 1;
  const restaurantHours = [
    {
      restaurant_id: 1,
      day: Day.MON,
      start: '08:00',
      end: '10:00',
    },
    {
      restaurant_id: 1,
      day: Day.TUE,
      start: '08:00',
      end: '10:00',
    },
    {
      restaurant_id: 1,
      day: Day.TUE,
      start: '18:00',
      end: '20:00',
    },
  ];
  const mockRestaurantHourEntities = [
    {
      restaurant_hours_id: 117,
      restaurant_id: 1,
      day: Day.MON,
      start: '08:00',
      end: '10:00',
    },
    {
      restaurant_hours_id: 118,
      restaurant_id: 1,
      day: Day.TUE,
      start: '08:00',
      end: '10:00',
    },
    {
      restaurant_hours_id: 119,
      restaurant_id: 1,
      day: Day.TUE,
      start: '18:00',
      end: '20:00',
    },
  ];
  describe('insertRestaurantHours', () => {
    it('should insert restaurant hours', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: mockRestaurantHourEntities });
      const REPOSITORY: any = {
        insert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await restaurantHoursModel.insertRestaurantHours(restaurantHours);
      // enforce test expectations
      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantHourEntities);
    });
    it('should throw a HttpException if any error occurs while inserting restaurant hour entity', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        insert,
      });

      try {
        await restaurantHoursModel.insertRestaurantHours(restaurantHours);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('deleteRestaurantHours', () => {
    it('should delete restaurant hours', async () => {
      const deleteSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      // call on the service like the controller would
      await restaurantHoursModel.deleteRestaurantHours(RESTAURANT_ID);
      // enforce test expectations
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting restaurant hours', async () => {
      const deleteSpy = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });

      try {
        await restaurantHoursModel.deleteRestaurantHours(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
