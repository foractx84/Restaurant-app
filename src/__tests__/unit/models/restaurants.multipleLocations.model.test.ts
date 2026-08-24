import { EntityManager } from 'typeorm';
import RestaurantsModel from '@/models/restaurants.model';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ormConnection } from '@/utils/dbUtils';

jest.mock('@/utils/dbUtils', () => ({
  __esModule: true,
  ormConnection: jest.fn(),
  rawQuery: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const restaurantsModel = new RestaurantsModel();

describe('RestaurantsModel - Multiple Locations', () => {
  const BRAND_ID = '11111111-1111-4111-8111-111111111111';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getRestaurantsByBrandID', () => {
    it('should get restaurants by brand id using provided repository', async () => {
      const restaurants = [
        {
          restaurant_id: 1001,
          name: 'Location A',
          brand_id: BRAND_ID,
          list_order: 0,
          deleted: false,
        },
        {
          restaurant_id: 1002,
          name: 'Location B',
          brand_id: BRAND_ID,
          list_order: 1,
          deleted: false,
        },
      ] as RestaurantEntity[];

      const repository = {
        find: jest.fn().mockResolvedValueOnce(restaurants),
      } as unknown as EntityManager;

      const result = await restaurantsModel.getRestaurantsByBrandID(BRAND_ID, repository);

      expect(repository.find).toHaveBeenCalledWith(RestaurantEntity, {
        where: {
          brand_id: BRAND_ID,
          deleted: false,
        },
        order: {
          list_order: 'ASC',
          name: 'ASC',
        },
      });

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(restaurants);
    });

    it('should get orm connection when repository is not provided', async () => {
      const repository = {
        find: jest.fn().mockResolvedValueOnce([]),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      const result = await restaurantsModel.getRestaurantsByBrandID(BRAND_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.find).toHaveBeenCalledWith(RestaurantEntity, {
        where: {
          brand_id: BRAND_ID,
          deleted: false,
        },
        order: {
          list_order: 'ASC',
          name: 'ASC',
        },
      });

      expect(result).toEqual([]);
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const repository = {
        find: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(restaurantsModel.getRestaurantsByBrandID(BRAND_ID, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('updateRestaurantListOrder', () => {
    it('should update restaurant list order using provided repository', async () => {
      const restaurantID = 1001;
      const listOrder = 2;

      const repository = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EntityManager;

      await restaurantsModel.updateRestaurantListOrder(restaurantID, listOrder, repository);

      expect(repository.update).toHaveBeenCalledWith(RestaurantEntity, restaurantID, {
        list_order: listOrder,
      });

      expect(ormConnection).not.toHaveBeenCalled();
    });

    it('should get orm connection when repository is not provided', async () => {
      const restaurantID = 1001;
      const listOrder = 2;

      const repository = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      await restaurantsModel.updateRestaurantListOrder(restaurantID, listOrder);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.update).toHaveBeenCalledWith(RestaurantEntity, restaurantID, {
        list_order: listOrder,
      });
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const repository = {
        update: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(restaurantsModel.updateRestaurantListOrder(1001, 1, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
