import { TapManagerError } from '@exceptions/HttpException';
import EventSettingsService from '@services/eventSettings.service';
import EventSettingsModel from '@/models/eventSettings.model';
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
import { EventSettingsEntity } from '@/entities/eventSettings.entity';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/eventSettings.model', () => {
  const mock = {
    fetchByRestaurantID: jest.fn(),
    upsertByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});
jest.mock('@/services/restaurants.service', () => {
  const mock = {
    findRestaurantEntityByID: jest.fn(),
    updateRestaurantEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockModel = new EventSettingsModel();
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
const service = new EventSettingsService(mockModel, mockRestaurantsService);

const RESTAURANT_ID = 20;

const ENABLED_RESTAURANT: RestaurantEntity = {
  restaurant_id: RESTAURANT_ID,
  is_events_enabled: true,
};

const SETTINGS_ROW: EventSettingsEntity = {
  event_setting_id: 1,
  restaurant_id: RESTAURANT_ID,
  section_title: "Bob's Crab Shack",
  events_text: 'Host your event here.',
  deck_url: 'https://example.com/deck.pdf',
  is_inquiry_form_enabled: true,
  notification_email: 'events@example.com',
};

describe('eventSettingsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getEventSettings', () => {
    it('should return content + flag when both restaurant and settings row exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENABLED_RESTAURANT);
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(SETTINGS_ROW);

      const result = await service.getEventSettings(RESTAURANT_ID);

      expect(result).toEqual({
        isEventsEnabled: true,
        sectionTitle: "Bob's Crab Shack",
        eventsText: 'Host your event here.',
        deckUrl: 'https://example.com/deck.pdf',
        isInquiryFormEnabled: true,
        notificationEmail: 'events@example.com',
      });
    });

    it('should return defaults when no settings row exists yet', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENABLED_RESTAURANT);
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const result = await service.getEventSettings(RESTAURANT_ID);

      expect(result).toEqual({
        isEventsEnabled: true,
        sectionTitle: '',
        eventsText: '',
        deckUrl: null,
        isInquiryFormEnabled: false,
        notificationEmail: null,
      });
    });

    it('should throw 404 if restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.getEventSettings(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('updateEventSettings', () => {
    it('should write only the flag when only the flag field is supplied', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENABLED_RESTAURANT);
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(SETTINGS_ROW);

      const result = await service.updateEventSettings(RESTAURANT_ID, { isEventsEnabled: true });

      expect(mockRestaurantsService.updateRestaurantEntity).toHaveBeenCalledWith({ is_events_enabled: true }, RESTAURANT_ID);
      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {});
      expect(result.isEventsEnabled).toBe(true);
    });

    it('should persist sectionTitle/eventsText/inquiry flag and return saved values', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENABLED_RESTAURANT);
      const saved: EventSettingsEntity = {
        ...SETTINGS_ROW,
        section_title: 'Updated',
        events_text: 'Updated body',
        is_inquiry_form_enabled: true,
      };
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(saved);

      const result = await service.updateEventSettings(RESTAURANT_ID, {
        isEventsEnabled: true,
        sectionTitle: 'Updated',
        eventsText: 'Updated body',
        isInquiryFormEnabled: true,
      });

      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {
        section_title: 'Updated',
        events_text: 'Updated body',
        is_inquiry_form_enabled: true,
      });
      expect(result.sectionTitle).toEqual('Updated');
      expect(result.isInquiryFormEnabled).toBe(true);
    });

    it('should clear deckUrl when null is explicitly provided', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENABLED_RESTAURANT);
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ ...SETTINGS_ROW, deck_url: undefined });

      const result = await service.updateEventSettings(RESTAURANT_ID, { isEventsEnabled: true, deckUrl: null });

      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { deck_url: null });
      expect(result.deckUrl).toBeNull();
    });

    it('should clear notificationEmail when null is explicitly provided', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(ENABLED_RESTAURANT);
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ ...SETTINGS_ROW, notification_email: undefined });

      const result = await service.updateEventSettings(RESTAURANT_ID, { isEventsEnabled: true, notificationEmail: null });

      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { notification_email: null });
      expect(result.notificationEmail).toBeNull();
    });

    it('should throw 404 if restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateEventSettings(RESTAURANT_ID, { isEventsEnabled: true });
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockRestaurantsService.updateRestaurantEntity).not.toHaveBeenCalled();
      expect(mockModel.upsertByRestaurantID).not.toHaveBeenCalled();
    });
  });
});
