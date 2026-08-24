import BrandsModel from '@/models/brands.model';
import RestaurantsModel from '@/models/restaurants.model';
import BrandsService from '@/services/brands.service';
import RestaurantGroupsService from '@/services/restaurantGroups.service';
import { BrandEntity } from '@/entities/brand.entity';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';

jest.mock('@/models/brands.model', () => {
  const mockBrandsModel = {
    getBrandsByRestaurantGroupID: jest.fn(),
    getBrandByID: jest.fn(),
    createBrand: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockBrandsModel),
  };
});

jest.mock('@/models/restaurants.model', () => {
  const mockRestaurantsModel = {
    getRestaurantsByBrandID: jest.fn(),
    getRestaurantEntityByID: jest.fn(),
    updateRestaurantEntity: jest.fn(),
    updateRestaurantListOrder: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockRestaurantsModel),
  };
});

jest.mock('@/services/restaurantGroups.service', () => {
  const mockRestaurantGroupsService = {
    getRestaurantGroupByID: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockRestaurantGroupsService),
  };
});

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
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

const mockBrandsModel = new BrandsModel();
const mockRestaurantsModel = new RestaurantsModel();
const mockRestaurantGroupsService = new RestaurantGroupsService({} as any);

const brandsService = new BrandsService(mockBrandsModel, mockRestaurantGroupsService, mockRestaurantsModel);

describe('BrandsService', () => {
  const BRAND_ID = '11111111-1111-4111-8111-111111111111';
  const RESTAURANT_GROUP_ID = '22222222-2222-4222-8222-222222222222';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getBrandByID', () => {
    it('should successfully return brand by id', async () => {
      const brand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: 'Test Brand',
      } as BrandEntity;

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce(brand);

      const result = await brandsService.getBrandByID(BRAND_ID);

      expect(mockBrandsModel.getBrandByID).toHaveBeenCalledWith(BRAND_ID);

      expect(result).toEqual(brand);
    });

    it('should throw 404 when brand does not exist', async () => {
      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await expect(brandsService.getBrandByID(BRAND_ID)).rejects.toMatchObject({
        status: 404,
      });

      expect(mockBrandsModel.getBrandByID).toHaveBeenCalledWith(BRAND_ID);
    });

    it('should rethrow HttpException from model', async () => {
      const httpException = new HttpException(400, []);

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.getBrandByID(BRAND_ID)).rejects.toBe(httpException);
    });

    it('should throw 500 when unexpected error occurs', async () => {
      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('database failure'));

      await expect(brandsService.getBrandByID(BRAND_ID)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getBrandsByRestaurantGroupID', () => {
    it('should verify restaurant group and return brands', async () => {
      const brands = [
        {
          id: BRAND_ID,
          restaurantGroupID: RESTAURANT_GROUP_ID,
          name: 'Brand A',
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          restaurantGroupID: RESTAURANT_GROUP_ID,
          name: 'Brand B',
        },
      ] as BrandEntity[];

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      (mockBrandsModel.getBrandsByRestaurantGroupID as jest.MockedFunction<any>).mockResolvedValueOnce(brands);

      const result = await brandsService.getBrandsByRestaurantGroupID(RESTAURANT_GROUP_ID);

      expect(mockRestaurantGroupsService.getRestaurantGroupByID).toHaveBeenCalledWith(RESTAURANT_GROUP_ID);

      expect(mockBrandsModel.getBrandsByRestaurantGroupID).toHaveBeenCalledWith(RESTAURANT_GROUP_ID);

      expect(result).toEqual(brands);
    });

    it('should rethrow HttpException when restaurant group lookup fails', async () => {
      const httpException = new HttpException(404, []);

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.getBrandsByRestaurantGroupID(RESTAURANT_GROUP_ID)).rejects.toBe(httpException);

      expect(mockBrandsModel.getBrandsByRestaurantGroupID).not.toHaveBeenCalled();
    });

    it('should throw 500 when unexpected error occurs while getting brands', async () => {
      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('unexpected failure'));

      await expect(brandsService.getBrandsByRestaurantGroupID(RESTAURANT_GROUP_ID)).rejects.toMatchObject({
        status: 500,
      });

      expect(mockBrandsModel.getBrandsByRestaurantGroupID).not.toHaveBeenCalled();
    });
  });

  describe('createBrand', () => {
    it('should create brand when restaurant group exists', async () => {
      const name = 'Test Brand';

      const createdBrand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name,
      } as BrandEntity;

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      (mockBrandsModel.createBrand as jest.MockedFunction<any>).mockResolvedValueOnce(createdBrand);

      const result = await brandsService.createBrand(RESTAURANT_GROUP_ID, name);

      expect(mockRestaurantGroupsService.getRestaurantGroupByID).toHaveBeenCalledWith(RESTAURANT_GROUP_ID);

      expect(mockBrandsModel.createBrand).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantGroupID: RESTAURANT_GROUP_ID,
          name,
        }),
      );

      expect(result).toEqual(createdBrand);
    });

    it('should not create brand when restaurant group lookup throws HttpException', async () => {
      const httpException = new HttpException(404, []);

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.createBrand(RESTAURANT_GROUP_ID, 'Test Brand')).rejects.toBe(httpException);

      expect(mockBrandsModel.createBrand).not.toHaveBeenCalled();
    });

    it('should throw 500 when unexpected error occurs while creating brand', async () => {
      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('unexpected failure'));

      await expect(brandsService.createBrand(RESTAURANT_GROUP_ID, 'Test Brand')).rejects.toMatchObject({
        status: 500,
      });

      expect(mockBrandsModel.createBrand).not.toHaveBeenCalled();
    });
  });

  describe('getRestaurantsByBrandID', () => {
    it('should verify brand and return restaurant locations', async () => {
      const brand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: 'Test Brand',
      } as BrandEntity;

      const restaurants = [
        {
          restaurant_id: 1001,
          name: 'Location A',
          brand_id: BRAND_ID,
          list_order: 0,
        },
        {
          restaurant_id: 1002,
          name: 'Location B',
          brand_id: BRAND_ID,
          list_order: 1,
        },
      ] as RestaurantEntity[];

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce(brand);

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurants);

      const result = await brandsService.getRestaurantsByBrandID(BRAND_ID);

      expect(mockBrandsModel.getBrandByID).toHaveBeenCalledWith(BRAND_ID);

      expect(mockRestaurantsModel.getRestaurantsByBrandID).toHaveBeenCalledWith(BRAND_ID);

      expect(result).toEqual(restaurants);
    });

    it('should not get restaurants when brand lookup throws HttpException', async () => {
      const httpException = new HttpException(404, []);

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.getRestaurantsByBrandID(BRAND_ID)).rejects.toBe(httpException);

      expect(mockRestaurantsModel.getRestaurantsByBrandID).not.toHaveBeenCalled();
    });

    it('should throw 500 when unexpected error occurs while getting restaurants', async () => {
      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('unexpected failure'));

      await expect(brandsService.getRestaurantsByBrandID(BRAND_ID)).rejects.toMatchObject({
        status: 500,
      });

      expect(mockRestaurantsModel.getRestaurantsByBrandID).not.toHaveBeenCalled();
    });
  });

  describe('assignRestaurantToBrand', () => {
    it('should assign restaurant to brand', async () => {
      const restaurantID = 1001;

      const brand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: 'Test Brand',
      } as BrandEntity;

      const restaurant = {
        restaurant_id: restaurantID,
        name: 'Location A',
      } as RestaurantEntity;

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce(brand);

      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurant);

      await brandsService.assignRestaurantToBrand(restaurantID, BRAND_ID);

      expect(mockBrandsModel.getBrandByID).toHaveBeenCalledWith(BRAND_ID);

      expect(mockRestaurantsModel.getRestaurantEntityByID).toHaveBeenCalledWith(restaurantID);

      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(
        {
          brand_id: BRAND_ID,
        },
        restaurantID,
      );
    });

    it('should throw 404 when restaurant does not exist', async () => {
      const restaurantID = 1001;

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await expect(brandsService.assignRestaurantToBrand(restaurantID, BRAND_ID)).rejects.toMatchObject({
        status: 404,
      });

      expect(mockRestaurantsModel.updateRestaurantEntity).not.toHaveBeenCalled();
    });

    it('should not look up restaurant when brand lookup throws HttpException', async () => {
      const restaurantID = 1001;
      const httpException = new HttpException(404, []);

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.assignRestaurantToBrand(restaurantID, BRAND_ID)).rejects.toBe(httpException);

      expect(mockRestaurantsModel.getRestaurantEntityByID).not.toHaveBeenCalled();

      expect(mockRestaurantsModel.updateRestaurantEntity).not.toHaveBeenCalled();
    });

    it('should throw 500 when updating restaurant fails unexpectedly', async () => {
      const restaurantID = 1001;

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: restaurantID,
      });

      (mockRestaurantsModel.updateRestaurantEntity as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('update failed'));

      await expect(brandsService.assignRestaurantToBrand(restaurantID, BRAND_ID)).rejects.toMatchObject({
        status: 500,
      });

      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(
        {
          brand_id: BRAND_ID,
        },
        restaurantID,
      );
    });
  });

  describe('updateRestaurantOrder', () => {
    it('should update restaurant list order inside a transaction', async () => {
      const restaurantIDs = [1003, 1001, 1002];

      const restaurants = [
        {
          restaurant_id: 1001,
          brand_id: BRAND_ID,
        },
        {
          restaurant_id: 1002,
          brand_id: BRAND_ID,
        },
        {
          restaurant_id: 1003,
          brand_id: BRAND_ID,
        },
      ] as RestaurantEntity[];

      const manager = {};

      const transaction = jest.fn(async (callback: (manager: any) => Promise<void>) => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurants);

      await brandsService.updateRestaurantOrder(BRAND_ID, restaurantIDs);

      expect(transaction).toHaveBeenCalledTimes(1);

      expect(mockRestaurantsModel.getRestaurantsByBrandID).toHaveBeenCalledWith(BRAND_ID, manager);

      expect(mockRestaurantsModel.updateRestaurantListOrder).toHaveBeenNthCalledWith(1, 1003, 0, manager);

      expect(mockRestaurantsModel.updateRestaurantListOrder).toHaveBeenNthCalledWith(2, 1001, 1, manager);

      expect(mockRestaurantsModel.updateRestaurantListOrder).toHaveBeenNthCalledWith(3, 1002, 2, manager);

      expect(mockRestaurantsModel.updateRestaurantListOrder).toHaveBeenCalledTimes(3);
    });

    it('should reject reorder when not all brand restaurants are included', async () => {
      const restaurantIDs = [1001, 1002];

      const manager = {};

      const transaction = jest.fn(async (callback: (manager: any) => Promise<void>) => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurant_id: 1001,
          brand_id: BRAND_ID,
        },
        {
          restaurant_id: 1002,
          brand_id: BRAND_ID,
        },
        {
          restaurant_id: 1003,
          brand_id: BRAND_ID,
        },
      ]);

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, restaurantIDs)).rejects.toMatchObject({
        status: 400,
      });

      expect(mockRestaurantsModel.updateRestaurantListOrder).not.toHaveBeenCalled();
    });

    it('should reject restaurant that does not belong to brand and not update any restaurant', async () => {
      const restaurantIDs = [1001, 9999];

      const manager = {};

      const transaction = jest.fn(async (callback: (manager: any) => Promise<void>) => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurant_id: 1001,
          brand_id: BRAND_ID,
        },
        {
          restaurant_id: 1002,
          brand_id: BRAND_ID,
        },
      ]);

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, restaurantIDs)).rejects.toMatchObject({
        status: 400,
      });

      expect(mockRestaurantsModel.updateRestaurantListOrder).not.toHaveBeenCalled();
    });

    it('should throw 500 when orm connection fails', async () => {
      (ormConnection as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('database connection failed'));

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, [1001])).rejects.toMatchObject({
        status: 500,
      });

      expect(mockRestaurantsModel.updateRestaurantListOrder).not.toHaveBeenCalled();
    });

    it('should throw 500 when restaurant order update fails during transaction', async () => {
      const restaurantIDs = [1001, 1002];

      const manager = {};

      const transaction = jest.fn(async (callback: (manager: any) => Promise<void>) => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurant_id: 1001,
          brand_id: BRAND_ID,
        },
        {
          restaurant_id: 1002,
          brand_id: BRAND_ID,
        },
      ]);

      (mockRestaurantsModel.updateRestaurantListOrder as jest.MockedFunction<any>)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('update failed'));

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, restaurantIDs)).rejects.toMatchObject({
        status: 500,
      });

      expect(transaction).toHaveBeenCalledTimes(1);

      expect(mockRestaurantsModel.updateRestaurantListOrder).toHaveBeenNthCalledWith(1, 1001, 0, manager);

      expect(mockRestaurantsModel.updateRestaurantListOrder).toHaveBeenNthCalledWith(2, 1002, 1, manager);
    });

    it('should rethrow HttpException that occurs inside transaction', async () => {
      const manager = {};
      const httpException = new HttpException(404, []);

      const transaction = jest.fn(async (callback: (manager: any) => Promise<void>) => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, [1001])).rejects.toBe(httpException);

      expect(mockRestaurantsModel.getRestaurantsByBrandID).not.toHaveBeenCalled();

      expect(mockRestaurantsModel.updateRestaurantListOrder).not.toHaveBeenCalled();
    });
  });
});
