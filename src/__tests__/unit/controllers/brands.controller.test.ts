import { NextFunction, Request, Response } from 'express-serve-static-core';
import BrandsController from '@/controllers/brands.controller';
import BrandsService from '@/services/brands.service';
import { BrandEntity } from '@/entities/brand.entity';
import { RestaurantEntity } from '@/entities/restaurant.entity';

jest.mock('@/services/brands.service', () => {
  const mockBrandsService = {
    getBrandsByRestaurantGroupID: jest.fn(),
    getBrandByID: jest.fn(),
    createBrand: jest.fn(),
    getRestaurantsByBrandID: jest.fn(),
    assignRestaurantToBrand: jest.fn(),
    updateRestaurantOrder: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockBrandsService),
  };
});

const mockBrandsService = new BrandsService({} as any, {} as any, {} as any);

const brandsController = new BrandsController(mockBrandsService);

describe('BrandsController', () => {
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getBrandsByRestaurantGroupID', () => {
    it('should return brands by restaurant group id', async () => {
      const restaurantGroupID = '22222222-2222-4222-8222-222222222222';

      const brands = [
        {
          id: '11111111-1111-4111-8111-111111111111',
          restaurantGroupID,
          name: 'Brand A',
        },
      ] as BrandEntity[];

      const mockRequest = {
        params: {
          restaurantGroupID,
        },
      } as unknown as Request;

      (mockBrandsService.getBrandsByRestaurantGroupID as jest.MockedFunction<any>).mockResolvedValueOnce(brands);

      await brandsController.getBrandsByRestaurantGroupID(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.getBrandsByRestaurantGroupID).toHaveBeenCalledWith(restaurantGroupID);

      expect(mockResponse.json).toHaveBeenCalledWith(brands);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          restaurantGroupID: '22222222-2222-4222-8222-222222222222',
        },
      } as unknown as Request;

      (mockBrandsService.getBrandsByRestaurantGroupID as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.getBrandsByRestaurantGroupID(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBrandByID', () => {
    it('should return brand by id', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';

      const brand = {
        id: brandID,
        restaurantGroupID: '22222222-2222-4222-8222-222222222222',
        name: 'Test Brand',
      } as BrandEntity;

      const mockRequest = {
        params: {
          brandID,
        },
      } as unknown as Request;

      (mockBrandsService.getBrandByID as jest.MockedFunction<any>).mockResolvedValueOnce(brand);

      await brandsController.getBrandByID(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.getBrandByID).toHaveBeenCalledWith(brandID);

      expect(mockResponse.json).toHaveBeenCalledWith(brand);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          brandID: '11111111-1111-4111-8111-111111111111',
        },
      } as unknown as Request;

      (mockBrandsService.getBrandByID as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.getBrandByID(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createBrand', () => {
    it('should create brand and return 201', async () => {
      const restaurantGroupID = '22222222-2222-4222-8222-222222222222';

      const name = 'Test Brand';

      const createdBrand = {
        id: '11111111-1111-4111-8111-111111111111',
        restaurantGroupID,
        name,
      } as BrandEntity;

      const mockRequest = {
        params: {
          restaurantGroupID,
        },
        body: {
          name,
        },
      } as unknown as Request;

      (mockBrandsService.createBrand as jest.MockedFunction<any>).mockResolvedValueOnce(createdBrand);

      await brandsController.createBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.createBrand).toHaveBeenCalledWith(restaurantGroupID, name);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdBrand);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          restaurantGroupID: '22222222-2222-4222-8222-222222222222',
        },
        body: {
          name: 'Test Brand',
        },
      } as unknown as Request;

      (mockBrandsService.createBrand as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.createBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getRestaurantsByBrandID', () => {
    it('should return restaurants by brand id', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';

      const restaurants = [
        {
          restaurant_id: 1001,
          name: 'Location A',
          brand_id: brandID,
          list_order: 0,
        },
        {
          restaurant_id: 1002,
          name: 'Location B',
          brand_id: brandID,
          list_order: 1,
        },
      ] as RestaurantEntity[];

      const mockRequest = {
        params: {
          brandID,
        },
      } as unknown as Request;

      (mockBrandsService.getRestaurantsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurants);

      await brandsController.getRestaurantsByBrandID(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.getRestaurantsByBrandID).toHaveBeenCalledWith(brandID);

      expect(mockResponse.json).toHaveBeenCalledWith(restaurants);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          brandID: '11111111-1111-4111-8111-111111111111',
        },
      } as unknown as Request;

      (mockBrandsService.getRestaurantsByBrandID as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.getRestaurantsByBrandID(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('assignRestaurantToBrand', () => {
    it('should assign restaurant to brand and return 204', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';
      const restaurantID = 1001;

      const mockRequest = {
        params: {
          brandID,
          restaurantID: restaurantID.toString(),
        },
      } as unknown as Request;

      (mockBrandsService.assignRestaurantToBrand as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandsController.assignRestaurantToBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.assignRestaurantToBrand).toHaveBeenCalledWith(restaurantID, brandID);

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          brandID: '11111111-1111-4111-8111-111111111111',
          restaurantID: '1001',
        },
      } as unknown as Request;

      (mockBrandsService.assignRestaurantToBrand as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.assignRestaurantToBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateRestaurantOrder', () => {
    it('should update restaurant order and return 204', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';
      const restaurantIDs = [1003, 1001, 1002];

      const mockRequest = {
        params: {
          brandID,
        },
        body: {
          restaurantIDs,
        },
      } as unknown as Request;

      (mockBrandsService.updateRestaurantOrder as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandsController.updateRestaurantOrder(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.updateRestaurantOrder).toHaveBeenCalledWith(brandID, restaurantIDs);

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          brandID: '11111111-1111-4111-8111-111111111111',
        },
        body: {
          restaurantIDs: [1001],
        },
      } as unknown as Request;

      (mockBrandsService.updateRestaurantOrder as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.updateRestaurantOrder(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
