import { NextFunction, Request, Response } from 'express-serve-static-core';
import RestaurantGroupsController from '@/controllers/restaurantGroups.controller';
import RestaurantGroupsService from '@/services/restaurantGroups.service';
import { RestaurantGroupEntity } from '@/entities/restaurantGroup.entity';

jest.mock('@/services/restaurantGroups.service', () => {
  const mockRestaurantGroupsService = {
    getAllRestaurantGroups: jest.fn(),
    getRestaurantGroupByID: jest.fn(),
    createRestaurantGroup: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockRestaurantGroupsService),
  };
});

const mockRestaurantGroupsService = new RestaurantGroupsService({} as any);

const restaurantGroupsController = new RestaurantGroupsController(mockRestaurantGroupsService);

describe('RestaurantGroupsController', () => {
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllRestaurantGroups', () => {
    it('should return all restaurant groups', async () => {
      const restaurantGroups = [
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Restaurant Group A',
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Restaurant Group B',
        },
      ] as RestaurantGroupEntity[];

      (mockRestaurantGroupsService.getAllRestaurantGroups as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantGroups);

      const mockRequest = {} as Request;

      await restaurantGroupsController.getAllRestaurantGroups(mockRequest, mockResponse as Response, mockNext);

      expect(mockRestaurantGroupsService.getAllRestaurantGroups).toHaveBeenCalledTimes(1);

      expect(mockResponse.json).toHaveBeenCalledWith(restaurantGroups);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      (mockRestaurantGroupsService.getAllRestaurantGroups as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await restaurantGroupsController.getAllRestaurantGroups({} as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getRestaurantGroupByID', () => {
    it('should return restaurant group by id', async () => {
      const restaurantGroupID = '22222222-2222-4222-8222-222222222222';

      const restaurantGroup = {
        id: restaurantGroupID,
        name: 'Test Restaurant Group',
      } as RestaurantGroupEntity;

      const mockRequest = {
        params: {
          restaurantGroupID,
        },
      } as unknown as Request;

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantGroup);

      await restaurantGroupsController.getRestaurantGroupByID(mockRequest, mockResponse as Response, mockNext);

      expect(mockRestaurantGroupsService.getRestaurantGroupByID).toHaveBeenCalledWith(restaurantGroupID);

      expect(mockResponse.json).toHaveBeenCalledWith(restaurantGroup);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        params: {
          restaurantGroupID: '22222222-2222-4222-8222-222222222222',
        },
      } as unknown as Request;

      (mockRestaurantGroupsService.getRestaurantGroupByID as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await restaurantGroupsController.getRestaurantGroupByID(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createRestaurantGroup', () => {
    it('should create restaurant group and return 201', async () => {
      const name = 'Test Restaurant Group';

      const createdRestaurantGroup = {
        id: '22222222-2222-4222-8222-222222222222',
        name,
      } as RestaurantGroupEntity;

      const mockRequest = {
        body: {
          name,
        },
      } as unknown as Request;

      (mockRestaurantGroupsService.createRestaurantGroup as jest.MockedFunction<any>).mockResolvedValueOnce(createdRestaurantGroup);

      await restaurantGroupsController.createRestaurantGroup(mockRequest, mockResponse as Response, mockNext);

      expect(mockRestaurantGroupsService.createRestaurantGroup).toHaveBeenCalledWith(name);

      expect(mockResponse.status).toHaveBeenCalledWith(201);

      expect(mockResponse.json).toHaveBeenCalledWith(createdRestaurantGroup);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next', async () => {
      const error = new Error('service failure');

      const mockRequest = {
        body: {
          name: 'Test Restaurant Group',
        },
      } as unknown as Request;

      (mockRestaurantGroupsService.createRestaurantGroup as jest.MockedFunction<any>).mockRejectedValueOnce(error);

      await restaurantGroupsController.createRestaurantGroup(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
