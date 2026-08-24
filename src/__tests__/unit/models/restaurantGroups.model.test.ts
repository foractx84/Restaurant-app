import { EntityManager } from 'typeorm';
import RestaurantGroupsModel from '@/models/restaurantGroups.model';
import { RestaurantGroupEntity } from '@/entities/restaurantGroup.entity';
import { ormConnection } from '@/utils/dbUtils';

jest.mock('@/utils/dbUtils', () => ({
  __esModule: true,
  ormConnection: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const restaurantGroupsModel = new RestaurantGroupsModel();

describe('RestaurantGroupsModel', () => {
  const RESTAURANT_GROUP_ID = '22222222-2222-4222-8222-222222222222';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllRestaurantGroups', () => {
    it('should return all restaurant groups using provided repository', async () => {
      const restaurantGroups = [
        {
          id: RESTAURANT_GROUP_ID,
          name: 'Restaurant Group A',
        },
      ] as RestaurantGroupEntity[];

      const repository = {
        find: jest.fn().mockResolvedValueOnce(restaurantGroups),
      } as unknown as EntityManager;

      const result = await restaurantGroupsModel.getAllRestaurantGroups(repository);

      expect(repository.find).toHaveBeenCalledWith(RestaurantGroupEntity, {
        order: {
          name: 'ASC',
        },
      });

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(restaurantGroups);
    });

    it('should get orm connection when repository is not provided', async () => {
      const repository = {
        find: jest.fn().mockResolvedValueOnce([]),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      const result = await restaurantGroupsModel.getAllRestaurantGroups();

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.find).toHaveBeenCalledWith(RestaurantGroupEntity, {
        order: {
          name: 'ASC',
        },
      });

      expect(result).toEqual([]);
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const repository = {
        find: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(restaurantGroupsModel.getAllRestaurantGroups(repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getRestaurantGroupByID', () => {
    it('should return restaurant group by id using provided repository', async () => {
      const restaurantGroup = {
        id: RESTAURANT_GROUP_ID,
        name: 'Test Restaurant Group',
      } as RestaurantGroupEntity;

      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(restaurantGroup),
      } as unknown as EntityManager;

      const result = await restaurantGroupsModel.getRestaurantGroupByID(RESTAURANT_GROUP_ID, repository);

      expect(repository.findOne).toHaveBeenCalledWith(RestaurantGroupEntity, {
        id: RESTAURANT_GROUP_ID,
      });

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(restaurantGroup);
    });

    it('should get orm connection when repository is not provided', async () => {
      const restaurantGroup = {
        id: RESTAURANT_GROUP_ID,
        name: 'Test Restaurant Group',
      } as RestaurantGroupEntity;

      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(restaurantGroup),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      const result = await restaurantGroupsModel.getRestaurantGroupByID(RESTAURANT_GROUP_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.findOne).toHaveBeenCalledWith(RestaurantGroupEntity, {
        id: RESTAURANT_GROUP_ID,
      });

      expect(result).toEqual(restaurantGroup);
    });

    it('should return undefined when restaurant group does not exist', async () => {
      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EntityManager;

      const result = await restaurantGroupsModel.getRestaurantGroupByID(RESTAURANT_GROUP_ID, repository);

      expect(result).toBeUndefined();
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const repository = {
        findOne: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(restaurantGroupsModel.getRestaurantGroupByID(RESTAURANT_GROUP_ID, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('createRestaurantGroup', () => {
    it('should create restaurant group using provided repository', async () => {
      const restaurantGroup = new RestaurantGroupEntity('Test Restaurant Group');

      const savedRestaurantGroup = {
        ...restaurantGroup,
        id: RESTAURANT_GROUP_ID,
      } as RestaurantGroupEntity;

      const repository = {
        save: jest.fn().mockResolvedValueOnce(savedRestaurantGroup),
      } as unknown as EntityManager;

      const result = await restaurantGroupsModel.createRestaurantGroup(restaurantGroup, repository);

      expect(repository.save).toHaveBeenCalledWith(RestaurantGroupEntity, restaurantGroup);

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(savedRestaurantGroup);
    });

    it('should get orm connection when repository is not provided', async () => {
      const restaurantGroup = new RestaurantGroupEntity('Test Restaurant Group');

      const repository = {
        save: jest.fn().mockResolvedValueOnce(restaurantGroup),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      await restaurantGroupsModel.createRestaurantGroup(restaurantGroup);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.save).toHaveBeenCalledWith(RestaurantGroupEntity, restaurantGroup);
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const restaurantGroup = new RestaurantGroupEntity('Test Restaurant Group');

      const repository = {
        save: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(restaurantGroupsModel.createRestaurantGroup(restaurantGroup, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
