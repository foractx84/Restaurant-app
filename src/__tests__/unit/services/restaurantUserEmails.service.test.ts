import { TapManagerError } from '@exceptions/HttpException';
import RestaurantUserEmailsService from '@services/restaurantUserEmails.service';
import RestaurantUserEmailsModel from '@/models/restaurantUserEmails.model';
import RestaurantsService from '@services/restaurants.service';
import { CountryServiceInterface } from '@interfaces/country.interface';
import { CuisinesServiceInterface } from '@interfaces/cuisines.interface';
import { ManagerRestaurantServiceInterface } from '@interfaces/managerRestaurant.interface';
import { RestaurantAddressServiceInterface } from '@interfaces/restaurantAddress.interface';
import { RestaurantImagesServiceInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantsModelInterface } from '@interfaces/restaurants.interface';
import { RestaurantSocialsServiceInterface } from '@interfaces/restaurantSocials.interface';
import { RestaurantHoursServiceInterface } from '@interfaces/restaurantHours.interface';
import { RestaurantProfileAlbumsServiceInterface } from '@interfaces/restaurantProfileAlbums.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/restaurants.service', () => {
  const mockRestaurantsService = {
    findRestaurantEntityByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantsService) };
});

jest.mock('@/models/restaurantUserEmails.model', () => {
  const mockRestaurantUserEmailsModel = {
    fetchRestaurantUserEmailsByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantUserEmailsModel) };
});

const mockRestaurantsService = new RestaurantsService(
  {} as CountryServiceInterface,
  {} as CuisinesServiceInterface,
  {} as ManagerRestaurantServiceInterface,
  {} as RestaurantAddressServiceInterface,
  {} as RestaurantImagesServiceInterface,
  {} as RestaurantsModelInterface,
  {} as RestaurantSocialsServiceInterface,
  {} as RestaurantHoursServiceInterface,
  {} as RestaurantProfileAlbumsServiceInterface,
  { createConnectedAccountForRestaurant: jest.fn(), linkExistingConnectAccount: jest.fn() } as StripeConnectServiceInterface,
);
const mockRestaurantUserEmailsModel = new RestaurantUserEmailsModel();
const restaurantUserEmailsService = new RestaurantUserEmailsService(mockRestaurantsService, mockRestaurantUserEmailsModel);

describe('restaurantUserEmailsService', () => {
  const RESTAURANT_ID = 20;
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getRestaurantUserEmails', () => {
    const RESTAURANT_ENTITY: RestaurantEntity = {
      restaurant_id: RESTAURANT_ID,
      restaurant_url_id: 'URL_ID',
    };
    const USER_EMAIL_ENTITIES: RestaurantUserEmailEntity[] = [
      new RestaurantUserEmailEntity('test1@email.com', 'URL_ID', 1, '2023-02-02T02:44:11.950Z', 1),
      new RestaurantUserEmailEntity('test2@email.com', 'URL_ID', 2, '2022-02-02T02:44:11.950Z', null),
    ];
    it('should successfully get submitted user emails for provided restaurant', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(RESTAURANT_ENTITY);
      (mockRestaurantUserEmailsModel.fetchRestaurantUserEmailsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(USER_EMAIL_ENTITIES);

      const result = await restaurantUserEmailsService.getRestaurantUserEmails(RESTAURANT_ID);
      expect(mockRestaurantUserEmailsModel.fetchRestaurantUserEmailsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          id: 1,
          userID: 1,
          email: 'test1@email.com',
          createdAt: '2023-02-02T02:44:11.950Z',
        },
        {
          id: 2,
          userID: null,
          email: 'test2@email.com',
          createdAt: '2022-02-02T02:44:11.950Z',
        },
      ]);
    });
    it('should throw 500 Bad Request HttpException if any error exists while fetching submitted user emails for restaurant', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantUserEmailsService.getRestaurantUserEmails(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockRestaurantsService.findRestaurantEntityByID).toHaveBeenCalledTimes(1);
    });
    it('should throw 404 Not Found HttpException if error occurs while fetching submitted user emails for restaurant', async () => {
      try {
        await restaurantUserEmailsService.getRestaurantUserEmails(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
