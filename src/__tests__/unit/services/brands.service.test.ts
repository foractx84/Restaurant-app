import BrandsModel from '@/models/brands.model';
import RestaurantsModel from '@/models/restaurants.model';
import BrandsService from '@/services/brands.service';
import RestaurantGroupsService from '@/services/restaurantGroups.service';
import BrandSocialsService from '@/services/brandSocials.service';
import { BrandEntity } from '@/entities/brand.entity';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { CreateBrandDto, EditBrandDto } from '@/dtos/brand.dto';

jest.mock('@/models/brands.model', () => {
  const mockBrandsModel = {
    getBrandsByRestaurantGroupID: jest.fn(),
    getBrandByID: jest.fn(),
    createBrand: jest.fn(),
    updateBrand: jest.fn(),
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

jest.mock('@/services/brandSocials.service', () => {
  const mockBrandSocialsService = {
    createBrandSocials: jest.fn(),
    getBrandSocialsByBrandID: jest.fn(),
    updateBrandSocials: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockBrandSocialsService),
  };
});

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

const mockBrandsModel = new BrandsModel();
const mockRestaurantsModel = new RestaurantsModel();
const mockRestaurantGroupsService = new RestaurantGroupsService({} as any);
const mockBrandSocialsService = new BrandSocialsService({} as any);

const brandsService = new BrandsService(mockBrandsModel, mockRestaurantGroupsService, mockRestaurantsModel, mockBrandSocialsService);

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
        description: 'Test description',
        cuisineID: 1,
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
    const brandRequest: CreateBrandDto = {
      name: 'Test Brand',
      description: 'Test description',
      website: 'https://test.com',
      primaryTagline: 'Primary tagline',
      secondaryTagline: 'Secondary tagline',
      reservationUrl: 'https://test.com/reserve',
      orderingUrl: 'https://test.com/order',
      cuisineID: 1,
    };

    it('should create brand with brand-level fields inside transaction', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        return await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      const createdBrand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        ...brandRequest,
      } as BrandEntity;

      (mockBrandsModel.createBrand as jest.MockedFunction<any>).mockResolvedValueOnce(createdBrand);

      const result = await brandsService.createBrand(RESTAURANT_GROUP_ID, brandRequest);

      expect(mockRestaurantGroupsService.getRestaurantGroupByID).toHaveBeenCalledWith(RESTAURANT_GROUP_ID);

      expect(transaction).toHaveBeenCalledTimes(1);

      expect(mockBrandsModel.createBrand).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantGroupID: RESTAURANT_GROUP_ID,
          name: brandRequest.name,
          description: brandRequest.description,
          website: brandRequest.website,
          primaryTagline: brandRequest.primaryTagline,
          secondaryTagline: brandRequest.secondaryTagline,
          reservationUrl: brandRequest.reservationUrl,
          orderingUrl: brandRequest.orderingUrl,
          cuisineID: brandRequest.cuisineID,
        }),
        manager,
      );

      expect(mockBrandSocialsService.createBrandSocials).not.toHaveBeenCalled();

      expect(result).toEqual(createdBrand);
    });

    it('should create brand socials when socials are provided', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        return await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      const requestWithSocials: CreateBrandDto = {
        ...brandRequest,
        socials: {
          facebook: 'https://facebook.com/test',
          instagram: 'https://instagram.com/test',
        },
      };

      const createdBrand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: requestWithSocials.name,
      } as BrandEntity;

      (mockBrandsModel.createBrand as jest.MockedFunction<any>).mockResolvedValueOnce(createdBrand);

      (mockBrandSocialsService.createBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce({});

      const result = await brandsService.createBrand(RESTAURANT_GROUP_ID, requestWithSocials);

      expect(mockBrandSocialsService.createBrandSocials).toHaveBeenCalledWith(
        {
          brandID: BRAND_ID,
          facebook: 'https://facebook.com/test',
          instagram: 'https://instagram.com/test',
        },
        manager,
      );

      expect(result).toEqual(createdBrand);
    });

    it('should not create empty brand socials', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        return await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      const requestWithEmptySocials: CreateBrandDto = {
        ...brandRequest,
        socials: {
          facebook: '',
          instagram: '',
        },
      };

      const createdBrand = {
        id: BRAND_ID,
        restaurantGroupID: RESTAURANT_GROUP_ID,
        name: brandRequest.name,
      } as BrandEntity;

      (mockBrandsModel.createBrand as jest.MockedFunction<any>).mockResolvedValueOnce(createdBrand);

      await brandsService.createBrand(RESTAURANT_GROUP_ID, requestWithEmptySocials);

      expect(mockBrandSocialsService.createBrandSocials).not.toHaveBeenCalled();
    });

    it('should not create brand when restaurant group lookup throws HttpException', async () => {
      const httpException = new HttpException(404, []);

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.createBrand(RESTAURANT_GROUP_ID, brandRequest)).rejects.toBe(httpException);

      expect(mockBrandsModel.createBrand).not.toHaveBeenCalled();
      expect(ormConnection).not.toHaveBeenCalled();
    });

    it('should throw 500 when unexpected error occurs while creating brand', async () => {
      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('unexpected failure'));

      await expect(brandsService.createBrand(RESTAURANT_GROUP_ID, brandRequest)).rejects.toMatchObject({
        status: 500,
      });

      expect(mockBrandsModel.createBrand).not.toHaveBeenCalled();
    });
  });

  describe('updateBrand', () => {
    it('should update brand-level fields inside transaction', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
        name: 'Test Brand',
      });

      const brandRequest: EditBrandDto = {
        name: 'Updated Brand',
        description: 'Updated description',
        website: 'https://updated.com',
        primaryTagline: 'Updated primary',
        secondaryTagline: 'Updated secondary',
        reservationUrl: 'https://updated.com/reserve',
        orderingUrl: 'https://updated.com/order',
        cuisineID: 2,
      };

      await brandsService.updateBrand(BRAND_ID, brandRequest);

      expect(mockBrandsModel.updateBrand).toHaveBeenCalledWith(
        BRAND_ID,
        {
          name: 'Updated Brand',
          description: 'Updated description',
          website: 'https://updated.com',
          primaryTagline: 'Updated primary',
          secondaryTagline: 'Updated secondary',
          reservationUrl: 'https://updated.com/reserve',
          orderingUrl: 'https://updated.com/order',
          cuisineID: 2,
        },
        manager,
      );

      expect(mockBrandSocialsService.getBrandSocialsByBrandID).not.toHaveBeenCalled();
    });

    it('should support partial brand update', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      const brandRequest: EditBrandDto = {
        description: 'Only description changed',
      };

      await brandsService.updateBrand(BRAND_ID, brandRequest);

      expect(mockBrandsModel.updateBrand).toHaveBeenCalledWith(
        BRAND_ID,
        {
          description: 'Only description changed',
        },
        manager,
      );
    });

    it('should preserve empty string updates', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      const brandRequest: EditBrandDto = {
        description: '',
        website: '',
      };

      await brandsService.updateBrand(BRAND_ID, brandRequest);

      expect(mockBrandsModel.updateBrand).toHaveBeenCalledWith(
        BRAND_ID,
        {
          description: '',
          website: '',
        },
        manager,
      );
    });

    it('should update existing brand socials', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockBrandSocialsService.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce({
        brandSocialsID: 10,
        brandID: BRAND_ID,
        facebook: 'old-facebook',
      });

      const brandRequest: EditBrandDto = {
        socials: {
          facebook: 'https://facebook.com/updated',
        },
      };

      await brandsService.updateBrand(BRAND_ID, brandRequest);

      expect(mockBrandSocialsService.getBrandSocialsByBrandID).toHaveBeenCalledWith(BRAND_ID, manager);

      expect(mockBrandSocialsService.updateBrandSocials).toHaveBeenCalledWith(
        {
          facebook: 'https://facebook.com/updated',
          brandID: BRAND_ID,
          brandSocialsID: 10,
        },
        manager,
      );

      expect(mockBrandSocialsService.createBrandSocials).not.toHaveBeenCalled();
    });

    it('should create brand socials when none exist', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockBrandSocialsService.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      const brandRequest: EditBrandDto = {
        socials: {
          instagram: 'https://instagram.com/new',
        },
      };

      await brandsService.updateBrand(BRAND_ID, brandRequest);

      expect(mockBrandSocialsService.createBrandSocials).toHaveBeenCalledWith(
        {
          brandID: BRAND_ID,
          instagram: 'https://instagram.com/new',
        },
        manager,
      );

      expect(mockBrandSocialsService.updateBrandSocials).not.toHaveBeenCalled();
    });

    it('should not create socials when supplied socials are empty and none exist', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockBrandSocialsService.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await brandsService.updateBrand(BRAND_ID, {
        socials: {
          facebook: '',
          instagram: '',
        },
      });

      expect(mockBrandSocialsService.createBrandSocials).not.toHaveBeenCalled();
      expect(mockBrandSocialsService.updateBrandSocials).not.toHaveBeenCalled();
    });

    it('should rethrow HttpException when brand does not exist', async () => {
      const httpException = new HttpException(404, []);

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(
        brandsService.updateBrand(BRAND_ID, {
          description: 'Updated',
        }),
      ).rejects.toBe(httpException);

      expect(mockBrandsModel.updateBrand).not.toHaveBeenCalled();
    });

    it('should throw 500 when unexpected update error occurs', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockBrandsModel.updateBrand as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('update failed'));

      await expect(
        brandsService.updateBrand(BRAND_ID, {
          description: 'Updated',
        }),
      ).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('updateBrandLogo', () => {
    it('should update brand logo and return previous logo url', async () => {
      const brand = {
        id: BRAND_ID,
        logoUrl: 'old-logo.png',
      } as BrandEntity;

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce(brand);

      (mockBrandsModel.updateBrand as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const result = await brandsService.updateBrandLogo(BRAND_ID, 'new-logo.png');

      expect(mockBrandsModel.updateBrand).toHaveBeenCalledWith(BRAND_ID, {
        logoUrl: 'new-logo.png',
      });

      expect(result).toBe('old-logo.png');
    });

    it('should return undefined when brand has no previous logo', async () => {
      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
        logoUrl: undefined,
      });

      const result = await brandsService.updateBrandLogo(BRAND_ID, 'new-logo.png');

      expect(result).toBeUndefined();

      expect(mockBrandsModel.updateBrand).toHaveBeenCalledWith(BRAND_ID, {
        logoUrl: 'new-logo.png',
      });
    });

    it('should rethrow HttpException when brand lookup fails', async () => {
      const httpException = new HttpException(404, []);

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(brandsService.updateBrandLogo(BRAND_ID, 'new-logo.png')).rejects.toBe(httpException);

      expect(mockBrandsModel.updateBrand).not.toHaveBeenCalled();
    });

    it('should throw 500 when unexpected logo update error occurs', async () => {
      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockBrandsModel.updateBrand as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('update failed'));

      await expect(brandsService.updateBrandLogo(BRAND_ID, 'new-logo.png')).rejects.toMatchObject({
        status: 500,
      });
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

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: restaurantID,
        name: 'Location A',
      });

      await brandsService.assignRestaurantToBrand(restaurantID, BRAND_ID);

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
    });
  });

  describe('updateRestaurantOrder', () => {
    it('should update restaurant list order inside a transaction', async () => {
      const restaurantIDs = [1003, 1001, 1002];

      const restaurants = [
        { restaurant_id: 1001, brand_id: BRAND_ID },
        { restaurant_id: 1002, brand_id: BRAND_ID },
        { restaurant_id: 1003, brand_id: BRAND_ID },
      ] as RestaurantEntity[];

      const manager = {};

      const transaction = jest.fn(async callback => {
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
    });

    it('should reject reorder when not all brand restaurants are included', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce([
        { restaurant_id: 1001, brand_id: BRAND_ID },
        { restaurant_id: 1002, brand_id: BRAND_ID },
        { restaurant_id: 1003, brand_id: BRAND_ID },
      ]);

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, [1001, 1002])).rejects.toMatchObject({
        status: 400,
      });

      expect(mockRestaurantsModel.updateRestaurantListOrder).not.toHaveBeenCalled();
    });

    it('should reject restaurant that does not belong to brand', async () => {
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce([
        { restaurant_id: 1001, brand_id: BRAND_ID },
        { restaurant_id: 1002, brand_id: BRAND_ID },
      ]);

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, [1001, 9999])).rejects.toMatchObject({
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
      const manager = {};

      const transaction = jest.fn(async callback => {
        await callback(manager);
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      (mockBrandsModel.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: BRAND_ID,
      });

      (mockRestaurantsModel.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce([
        { restaurant_id: 1001, brand_id: BRAND_ID },
        { restaurant_id: 1002, brand_id: BRAND_ID },
      ]);

      (mockRestaurantsModel.updateRestaurantListOrder as jest.MockedFunction<any>)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('update failed'));

      await expect(brandsService.updateRestaurantOrder(BRAND_ID, [1001, 1002])).rejects.toMatchObject({
        status: 500,
      });

      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('should rethrow HttpException that occurs inside transaction', async () => {
      const manager = {};
      const httpException = new HttpException(404, []);

      const transaction = jest.fn(async callback => {
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
