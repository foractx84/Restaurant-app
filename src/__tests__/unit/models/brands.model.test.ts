import { EntityManager } from 'typeorm';
import BrandsModel from '@/models/brands.model';
import { BrandEntity } from '@/entities/brand.entity';
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

const brandsModel = new BrandsModel();

describe('BrandsModel', () => {
  const BRAND_ID = '11111111-1111-4111-8111-111111111111';
  const RESTAURANT_GROUP_ID = '22222222-2222-4222-8222-222222222222';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getBrandsByRestaurantGroupID', () => {
    it('should get brands by restaurant group id using provided repository', async () => {
      const brands = [
        {
          id: BRAND_ID,
          restaurantGroupID: RESTAURANT_GROUP_ID,
          name: 'Brand A',
        },
      ] as BrandEntity[];

      const repository = {
        find: jest.fn().mockResolvedValueOnce(brands),
      } as unknown as EntityManager;

      const result = await brandsModel.getBrandsByRestaurantGroupID(RESTAURANT_GROUP_ID, repository);

      expect(repository.find).toHaveBeenCalledWith(BrandEntity, {
        where: {
          restaurantGroupID: RESTAURANT_GROUP_ID,
        },
        order: {
          name: 'ASC',
        },
      });

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(brands);
    });

    it('should get orm connection when repository is not provided', async () => {
      const brands = [] as BrandEntity[];

      const repository = {
        find: jest.fn().mockResolvedValueOnce(brands),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      const result = await brandsModel.getBrandsByRestaurantGroupID(RESTAURANT_GROUP_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.find).toHaveBeenCalledWith(BrandEntity, {
        where: {
          restaurantGroupID: RESTAURANT_GROUP_ID,
        },
        order: {
          name: 'ASC',
        },
      });

      expect(result).toEqual(brands);
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const repository = {
        find: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(brandsModel.getBrandsByRestaurantGroupID(RESTAURANT_GROUP_ID, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getBrandByID', () => {
    it('should get brand by id using provided repository', async () => {
      const brand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: 'Test Brand',
      } as BrandEntity;

      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(brand),
      } as unknown as EntityManager;

      const result = await brandsModel.getBrandByID(BRAND_ID, repository);

      expect(repository.findOne).toHaveBeenCalledWith(BrandEntity, {
        id: BRAND_ID,
      });

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(brand);
    });

    it('should get orm connection when repository is not provided', async () => {
      const brand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: 'Test Brand',
      } as BrandEntity;

      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(brand),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      const result = await brandsModel.getBrandByID(BRAND_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.findOne).toHaveBeenCalledWith(BrandEntity, {
        id: BRAND_ID,
      });

      expect(result).toEqual(brand);
    });

    it('should return undefined when brand does not exist', async () => {
      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EntityManager;

      const result = await brandsModel.getBrandByID(BRAND_ID, repository);

      expect(result).toBeUndefined();
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const repository = {
        findOne: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(brandsModel.getBrandByID(BRAND_ID, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('createBrand', () => {
    it('should create brand using provided repository', async () => {
      const brand = new BrandEntity(RESTAURANT_GROUP_ID, 'Test Brand');

      const savedBrand = {
        ...brand,
        id: BRAND_ID,
      } as BrandEntity;

      const repository = {
        save: jest.fn().mockResolvedValueOnce(savedBrand),
      } as unknown as EntityManager;

      const result = await brandsModel.createBrand(brand, repository);

      expect(repository.save).toHaveBeenCalledWith(BrandEntity, brand);

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(savedBrand);
    });

    it('should get orm connection when repository is not provided', async () => {
      const brand = new BrandEntity(RESTAURANT_GROUP_ID, 'Test Brand');

      const repository = {
        save: jest.fn().mockResolvedValueOnce(brand),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      await brandsModel.createBrand(brand);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.save).toHaveBeenCalledWith(BrandEntity, brand);
    });

    it('should throw 500 HttpException when database operation fails', async () => {
      const brand = new BrandEntity(RESTAURANT_GROUP_ID, 'Test Brand');

      const repository = {
        save: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(brandsModel.createBrand(brand, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
