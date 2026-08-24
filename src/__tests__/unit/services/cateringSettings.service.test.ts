import { TapManagerError } from '@exceptions/HttpException';
import CateringSettingsService from '@services/cateringSettings.service';
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
  const mock = {
    findRestaurantEntityByID: jest.fn(),
    updateRestaurantEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
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
const service = new CateringSettingsService(mockRestaurantsService);

const RESTAURANT_ID = 20;

describe('cateringSettingsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getCateringSettings', () => {
    it('should map the restaurant entity columns to the response shape', async () => {
      const restaurant: RestaurantEntity = {
        restaurant_id: RESTAURANT_ID,
        is_catering_enabled: true,
        catering_notification_email: 'events@example.com',
      };
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurant);

      const result = await service.getCateringSettings(RESTAURANT_ID);

      expect(result).toEqual({
        isCateringEnabled: true,
        cateringNotificationEmail: 'events@example.com',
      });
    });

    it('should default an unset notification email to null', async () => {
      const restaurant: RestaurantEntity = {
        restaurant_id: RESTAURANT_ID,
        is_catering_enabled: false,
      };
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurant);

      const result = await service.getCateringSettings(RESTAURANT_ID);

      expect(result.cateringNotificationEmail).toBeNull();
      expect(result.isCateringEnabled).toBe(false);
    });

    it('should throw 404 if restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.getCateringSettings(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('updateCateringSettings', () => {
    it('should write only the flag when no email field is provided', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_catering_enabled: false,
        catering_notification_email: 'old@example.com',
      });

      const result = await service.updateCateringSettings(RESTAURANT_ID, { isCateringEnabled: true });

      expect(mockRestaurantsService.updateRestaurantEntity).toHaveBeenCalledWith({ is_catering_enabled: true }, RESTAURANT_ID);
      // Email is unchanged because the request did not include the field; we
      // surface the existing restaurant value in the response.
      expect(result).toEqual({ isCateringEnabled: true, cateringNotificationEmail: 'old@example.com' });
    });

    it('should clear the email when null is explicitly provided', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_catering_enabled: true,
        catering_notification_email: 'old@example.com',
      });

      const result = await service.updateCateringSettings(RESTAURANT_ID, {
        isCateringEnabled: true,
        cateringNotificationEmail: null,
      });

      expect(mockRestaurantsService.updateRestaurantEntity).toHaveBeenCalledWith(
        { is_catering_enabled: true, catering_notification_email: null },
        RESTAURANT_ID,
      );
      expect(result.cateringNotificationEmail).toBeNull();
    });

    it('should set a new email when one is provided', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_catering_enabled: false,
      });

      const result = await service.updateCateringSettings(RESTAURANT_ID, {
        isCateringEnabled: true,
        cateringNotificationEmail: 'new@example.com',
      });

      expect(mockRestaurantsService.updateRestaurantEntity).toHaveBeenCalledWith(
        { is_catering_enabled: true, catering_notification_email: 'new@example.com' },
        RESTAURANT_ID,
      );
      expect(result.cateringNotificationEmail).toEqual('new@example.com');
    });

    it('should throw 404 if restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateCateringSettings(RESTAURANT_ID, { isCateringEnabled: true });
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockRestaurantsService.updateRestaurantEntity).not.toHaveBeenCalled();
    });
  });
});
