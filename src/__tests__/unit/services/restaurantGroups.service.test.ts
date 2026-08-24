import RestaurantGroupsModel from '@/models/restaurantGroups.model';
import RestaurantGroupsService from '@/services/restaurantGroups.service';
import { RestaurantGroupEntity } from '@/entities/restaurantGroup.entity';
import { HttpException } from '@exceptions/HttpException';

jest.mock('@/models/restaurantGroups.model', () => {
  const mockRestaurantGroupsModel = {
    getAllRestaurantGroups: jest.fn(),
    getRestaurantGroupByID: jest.fn(),
    createRestaurantGroup: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockRestaurantGroupsModel),
  };
});

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };

  return {
    __esModule: true,
    logger,
  };
});

const mockRestaurantGroupsModel = new RestaurantGroupsModel();

const restaurantGroupsService = new RestaurantGroupsService(mockRestaurantGroupsModel);

describe('RestaurantGroupsService', () => {
  const RESTAURANT_GROUP_ID = '22222222-2222-4222-8222-222222222222';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllRestaurantGroups', () => {
    it('should successfully return all restaurant groups', async () => {
      const restaurantGroups = [
        {
          id: RESTAURANT_GROUP_ID,
          name: 'Restaurant Group A',
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Restaurant Group B',
        },
      ] as RestaurantGroupEntity[];

      (mockRestaurantGroupsModel.getAllRestaurantGroups as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantGroups);

      const result = await restaurantGroupsService.getAllRestaurantGroups();

      expect(mockRestaurantGroupsModel.getAllRestaurantGroups).toHaveBeenCalledTimes(1);

      expect(result).toEqual(restaurantGroups);
    });

    it('should return empty array when no restaurant groups exist', async () => {
      (mockRestaurantGroupsModel.getAllRestaurantGroups as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await restaurantGroupsService.getAllRestaurantGroups();

      expect(mockRestaurantGroupsModel.getAllRestaurantGroups).toHaveBeenCalledTimes(1);

      expect(result).toEqual([]);
    });

    it('should rethrow HttpException from model', async () => {
      const httpException = new HttpException(400, []);

      (mockRestaurantGroupsModel.getAllRestaurantGroups as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(restaurantGroupsService.getAllRestaurantGroups()).rejects.toBe(httpException);
    });

    it('should throw 500 when unexpected error occurs', async () => {
      (mockRestaurantGroupsModel.getAllRestaurantGroups as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('database failure'));

      await expect(restaurantGroupsService.getAllRestaurantGroups()).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getRestaurantGroupByID', () => {
    it('should successfully return restaurant group by id', async () => {
      const restaurantGroup = {
        id: RESTAURANT_GROUP_ID,
        name: 'Test Restaurant Group',
      } as RestaurantGroupEntity;

      (mockRestaurantGroupsModel.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantGroup);

      const result = await restaurantGroupsService.getRestaurantGroupByID(RESTAURANT_GROUP_ID);

      expect(mockRestaurantGroupsModel.getRestaurantGroupByID).toHaveBeenCalledWith(RESTAURANT_GROUP_ID);

      expect(result).toEqual(restaurantGroup);
    });

    it('should throw 404 when restaurant group does not exist', async () => {
      (mockRestaurantGroupsModel.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await expect(restaurantGroupsService.getRestaurantGroupByID(RESTAURANT_GROUP_ID)).rejects.toMatchObject({
        status: 404,
      });

      expect(mockRestaurantGroupsModel.getRestaurantGroupByID).toHaveBeenCalledWith(RESTAURANT_GROUP_ID);
    });

    it('should rethrow HttpException from model', async () => {
      const httpException = new HttpException(400, []);

      (mockRestaurantGroupsModel.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(restaurantGroupsService.getRestaurantGroupByID(RESTAURANT_GROUP_ID)).rejects.toBe(httpException);
    });

    it('should throw 500 when unexpected error occurs', async () => {
      (mockRestaurantGroupsModel.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('database failure'));

      await expect(restaurantGroupsService.getRestaurantGroupByID(RESTAURANT_GROUP_ID)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('createRestaurantGroup', () => {
    it('should successfully create restaurant group', async () => {
      const name = 'Test Restaurant Group';

      const createdRestaurantGroup = {
        id: RESTAURANT_GROUP_ID,
        name,
      } as RestaurantGroupEntity;

      (mockRestaurantGroupsModel.createRestaurantGroup as jest.MockedFunction<any>).mockResolvedValueOnce(createdRestaurantGroup);

      const result = await restaurantGroupsService.createRestaurantGroup(name);

      expect(mockRestaurantGroupsModel.createRestaurantGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
        }),
      );

      expect(result).toEqual(createdRestaurantGroup);
    });

    it('should create RestaurantGroupEntity with provided name', async () => {
      const name = 'New Restaurant Group';

      (mockRestaurantGroupsModel.createRestaurantGroup as jest.MockedFunction<any>).mockImplementationOnce(
        async (restaurantGroup: RestaurantGroupEntity) => restaurantGroup,
      );

      const result = await restaurantGroupsService.createRestaurantGroup(name);

      expect(result).toEqual(
        expect.objectContaining({
          name,
        }),
      );
    });

    it('should rethrow HttpException from model', async () => {
      const httpException = new HttpException(400, []);

      (mockRestaurantGroupsModel.createRestaurantGroup as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(restaurantGroupsService.createRestaurantGroup('Test Restaurant Group')).rejects.toBe(httpException);
    });

    it('should throw 500 when unexpected error occurs while creating restaurant group', async () => {
      (mockRestaurantGroupsModel.createRestaurantGroup as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('database failure'));

      await expect(restaurantGroupsService.createRestaurantGroup('Test Restaurant Group')).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
