import { NextFunction, Request, Response } from 'express-serve-static-core';
import BrandsController from '@/controllers/brands.controller';
import BrandsService from '@/services/brands.service';
import { BrandEntity } from '@/entities/brand.entity';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { deleteImageIfExists } from '@/utils/imageUtils';

jest.mock('@/services/brands.service', () => {
  const mockBrandsService = {
    getBrandsByRestaurantGroupID: jest.fn(),
    getBrandByID: jest.fn(),
    createBrand: jest.fn(),
    updateBrand: jest.fn(),
    updateBrandLogo: jest.fn(),
    getRestaurantsByBrandID: jest.fn(),
    assignRestaurantToBrand: jest.fn(),
    updateRestaurantOrder: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockBrandsService),
  };
});

jest.mock('@/utils/imageUtils', () => ({
  __esModule: true,
  deleteImageIfExists: jest.fn(),
}));

const mockBrandsService = new BrandsService({} as any, {} as any, {} as any, {} as any);

const brandsController = new BrandsController(mockBrandsService);

describe('BrandsController', () => {
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      sendStatus: jest.fn(),
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
        description: 'Test description',
        website: 'https://test.com',
        cuisineID: 1,
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
    it('should create brand with full request and return 201', async () => {
      const restaurantGroupID = '22222222-2222-4222-8222-222222222222';

      const brandRequest = {
        name: 'Test Brand',
        description: 'Test description',
        website: 'https://test.com',
        primaryTagline: 'Primary tagline',
        secondaryTagline: 'Secondary tagline',
        reservationUrl: 'https://test.com/reserve',
        orderingUrl: 'https://test.com/order',
        cuisineID: 1,
        socials: {
          facebook: 'https://facebook.com/test',
          instagram: 'https://instagram.com/test',
        },
      };

      const createdBrand = {
        id: '11111111-1111-4111-8111-111111111111',
        restaurantGroupID,
        name: brandRequest.name,
      } as BrandEntity;

      const mockRequest = {
        params: {
          restaurantGroupID,
        },
        body: brandRequest,
      } as unknown as Request;

      (mockBrandsService.createBrand as jest.MockedFunction<any>).mockResolvedValueOnce(createdBrand);

      await brandsController.createBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.createBrand).toHaveBeenCalledWith(restaurantGroupID, brandRequest);

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

  describe('updateBrand', () => {
    it('should update brand and return 200', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';

      const brandRequest = {
        description: 'Updated description',
        website: 'https://updated.com',
        cuisineID: 2,
        socials: {
          facebook: 'https://facebook.com/updated',
        },
      };

      const mockRequest = {
        params: {
          brandID,
        },
        body: brandRequest,
      } as unknown as Request;

      (mockBrandsService.updateBrand as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandsController.updateBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.updateBrand).toHaveBeenCalledWith(brandID, brandRequest);

      expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          brandID: '11111111-1111-4111-8111-111111111111',
        },
        body: {
          description: 'Updated description',
        },
      } as unknown as Request;

      (mockBrandsService.updateBrand as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.updateBrand(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('uploadBrandLogo', () => {
    it('should update brand logo and return logo url', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';

      const logoFile = {
        fieldname: 'logo',
        originalname: 'logo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1000,
        filename: 'new-logo.png',
      } as Express.Multer.File;

      const mockRequest = {
        params: {
          brandID,
        },
        files: {
          logo: [logoFile],
        },
      } as unknown as Request;

      (mockBrandsService.updateBrandLogo as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandsController.uploadBrandLogo(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.updateBrandLogo).toHaveBeenCalledWith(brandID, 'new-logo.png');

      expect(deleteImageIfExists).not.toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      expect(mockResponse.json).toHaveBeenCalledWith({
        logoUrl: 'new-logo.png',
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should delete previous logo when replacing logo', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';

      const logoFile = {
        fieldname: 'logo',
        originalname: 'new-logo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1000,
        filename: 'new-logo.png',
      } as Express.Multer.File;

      const mockRequest = {
        params: {
          brandID,
        },
        files: {
          logo: [logoFile],
        },
      } as unknown as Request;

      (mockBrandsService.updateBrandLogo as jest.MockedFunction<any>).mockResolvedValueOnce('old-logo.png');

      await brandsController.uploadBrandLogo(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.updateBrandLogo).toHaveBeenCalledWith(brandID, 'new-logo.png');

      expect(deleteImageIfExists).toHaveBeenCalledWith('old-logo.png');

      expect(mockResponse.status).toHaveBeenCalledWith(200);

      expect(mockResponse.json).toHaveBeenCalledWith({
        logoUrl: 'new-logo.png',
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not delete previous logo when filename is the same', async () => {
      const brandID = '11111111-1111-4111-8111-111111111111';

      const logoFile = {
        fieldname: 'logo',
        filename: 'same-logo.png',
      } as Express.Multer.File;

      const mockRequest = {
        params: {
          brandID,
        },
        files: {
          logo: [logoFile],
        },
      } as unknown as Request;

      (mockBrandsService.updateBrandLogo as jest.MockedFunction<any>).mockResolvedValueOnce('same-logo.png');

      await brandsController.uploadBrandLogo(mockRequest, mockResponse as Response, mockNext);

      expect(deleteImageIfExists).not.toHaveBeenCalled();

      expect(mockResponse.json).toHaveBeenCalledWith({
        logoUrl: 'same-logo.png',
      });
    });

    it('should return 400 when logo file is missing', async () => {
      const mockRequest = {
        params: {
          brandID: '11111111-1111-4111-8111-111111111111',
        },
        files: {},
      } as unknown as Request;

      await brandsController.uploadBrandLogo(mockRequest, mockResponse as Response, mockNext);

      expect(mockBrandsService.updateBrandLogo).not.toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(400);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logo image is required.',
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should delete newly uploaded logo and pass error to next when service fails', async () => {
      const error = new Error('service failure');

      const brandID = '11111111-1111-4111-8111-111111111111';

      const logoFile = {
        fieldname: 'logo',
        filename: 'new-logo.png',
      } as Express.Multer.File;

      const mockRequest = {
        params: {
          brandID,
        },
        files: {
          logo: [logoFile],
        },
      } as unknown as Request;

      (mockBrandsService.updateBrandLogo as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await brandsController.uploadBrandLogo(mockRequest, mockResponse as Response, mockNext);

      expect(deleteImageIfExists).toHaveBeenCalledWith('new-logo.png');

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
