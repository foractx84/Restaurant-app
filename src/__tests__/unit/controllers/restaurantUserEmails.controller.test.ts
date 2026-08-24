import { NextFunction, Request, Response } from 'express-serve-static-core';
import { RestaurantUserEmailsModelInterface, RestaurantUserEmailsResponseInterface } from '@interfaces/restaurantUserEmails.interface';
import RestaurantUserEmailsController from '@controllers/restaurantUserEmails.controller';
import RestaurantUserEmailsService from '@services/restaurantUserEmails.service';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/restaurantUserEmails.service', () => {
  const mockRestaurantsService = {
    getRestaurantUserEmails: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantsService) };
});

const mockRestaurantEmailUsersService = new RestaurantUserEmailsService({} as RestaurantsServiceInterface, {} as RestaurantUserEmailsModelInterface);
const restaurantUserEmailsController = new RestaurantUserEmailsController(mockRestaurantEmailUsersService);

describe('restaurantUserEmailsController', () => {
  const RESTAURANT_ID = 20;
  const EMAIL_1 = 'test1@email.com';
  const EMAIL_2 = 'test2@email.com';
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getRestaurantUserEmails', () => {
    it('should successfully fetch submitted user emails for restaurant', async () => {
      const MANAGER_ID = 1;

      const entities: RestaurantUserEmailEntity[] = [
        new RestaurantUserEmailEntity(EMAIL_1, 'URL_ID', undefined, '2023-02-02T02:44:11.950Z'),
        new RestaurantUserEmailEntity(EMAIL_2, 'URL_ID', 99, '2022-02-02T02:44:11.950Z'),
      ];

      const USER_EMAILS: RestaurantUserEmailsResponseInterface[] = entities.map(entity => entity.toResponse());

      (mockRestaurantEmailUsersService.getRestaurantUserEmails as jest.MockedFunction<any>).mockResolvedValueOnce(USER_EMAILS);

      const mReq = {
        body: {},
      };

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: MANAGER_ID, isSuper: false, restaurantID: RESTAURANT_ID },
      };

      await restaurantUserEmailsController.getRestaurantUserEmails(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantEmailUsersService.getRestaurantUserEmails).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(responseObject).toEqual(USER_EMAILS);
    });
    it('should not retrieve submitted user emails to restaurant because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await restaurantUserEmailsController.getRestaurantUserEmails(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantEmailUsersService.getRestaurantUserEmails).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
