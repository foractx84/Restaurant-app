import { createOtterClient, notifyOtterPauseResult, notifyOtterStoreAvailability, notifyOtterStoreHours, notifyOtterUnpauseResult } from '@/api/otter.api';
import OtterStorefrontService from '@/services/otterStorefront.service';
import { HttpException } from '@exceptions/HttpException';
import { OtterAuthServiceInterface } from '@interfaces/otter.interface';
import { OtterWebhookEvent } from '@interfaces/otterIntegration.interface';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantHoursServiceInterface } from '@interfaces/restaurantHours.interface';
import { RestaurantAddressServiceInterface } from '@interfaces/restaurantAddress.interface';
import { OTTER_STOREFRONT_EVENT } from '@constants/otterStorefront.constants';
import { Day } from '@/enums/day';

jest.mock('@/api/otter.api', () => ({
  createOtterClient: jest.fn(),
  notifyOtterStoreAvailability: jest.fn(),
  notifyOtterStoreHours: jest.fn(),
  notifyOtterPauseResult: jest.fn(),
  notifyOtterUnpauseResult: jest.fn(),
}));

jest.mock('@utils/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

describe('OtterStorefrontService', () => {
  const RESTAURANT_ID = 42;
  const OTTER_STORE_UUID = 'cf0ce51b-d74e-40d3-b177-1925ab4edc0c';
  const EVENT_ID = 'ad4ff59d-04c0-4c7d-8ca3-e3a673f8443d';
  const OTTER_CLIENT = { post: jest.fn() };

  const mockPlatformIntegrationService = {
    getPlatformIntegrationByRestaurantIDAndPlatform: jest.fn(),
    getPlatformIntegrationByStoreIDAndPlatform: jest.fn(),
  } as unknown as PlatformIntegrationServiceInterface;

  const mockRestaurantsService = {
    findRestaurantAcceptingOrders: jest.fn(),
    setRestaurantAcceptingOrders: jest.fn(),
  } as unknown as RestaurantsServiceInterface;

  const mockRestaurantHoursService = {
    findRestaurantHoursByRestaurantID: jest.fn(),
  } as unknown as RestaurantHoursServiceInterface;

  const mockRestaurantAddressService = {
    getRestaurantAddressByRestaurantID: jest.fn(),
  } as unknown as RestaurantAddressServiceInterface;

  const mockOtterAuthService = {
    getValidAccessToken: jest.fn(),
    acquireAndStoreToken: jest.fn(),
  } as unknown as OtterAuthServiceInterface;

  let service: OtterStorefrontService;

  const webhook = (eventType: string, storeId: string = OTTER_STORE_UUID): OtterWebhookEvent =>
    ({ eventId: EVENT_ID, eventType, metadata: { storeId } }) as OtterWebhookEvent;

  // Separate helper rather than `webhook(type, undefined)` -- an explicit undefined triggers the
  // default parameter, which would silently exercise the happy path instead.
  const webhookWithoutStoreId = (eventType: string): OtterWebhookEvent =>
    ({ eventId: EVENT_ID, eventType, metadata: {} }) as OtterWebhookEvent;

  beforeEach(() => {
    // resetAllMocks, not clearAllMocks: several tests install rejecting/ordering implementations, and
    // clearAllMocks would leave those in place for every test that follows.
    jest.resetAllMocks();

    (notifyOtterStoreAvailability as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterStoreHours as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterPauseResult as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterUnpauseResult as jest.Mock).mockResolvedValue(undefined);
    (createOtterClient as jest.Mock).mockReturnValue(OTTER_CLIENT);
    (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue({
      restaurantID: RESTAURANT_ID,
      otterLocationID: OTTER_STORE_UUID,
    });
    (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue({
      restaurantID: RESTAURANT_ID,
      otterLocationID: OTTER_STORE_UUID,
    });
    (mockRestaurantsService.findRestaurantAcceptingOrders as jest.Mock).mockResolvedValue(true);
    (mockRestaurantsService.setRestaurantAcceptingOrders as jest.Mock).mockResolvedValue(undefined);
    (mockRestaurantHoursService.findRestaurantHoursByRestaurantID as jest.Mock).mockResolvedValue([]);
    (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.Mock).mockResolvedValue({ timezone: 'America/Los_Angeles' });

    service = new OtterStorefrontService(
      mockPlatformIntegrationService,
      mockRestaurantsService,
      mockRestaurantHoursService,
      mockRestaurantAddressService,
      mockOtterAuthService,
    );
  });

  describe('getStorefrontStatus', () => {
    it('returns the current flag alongside the connected store id', async () => {
      (mockRestaurantsService.findRestaurantAcceptingOrders as jest.Mock).mockResolvedValue(false);

      await expect(service.getStorefrontStatus(RESTAURANT_ID)).resolves.toEqual({
        restaurantID: RESTAURANT_ID,
        isAcceptingOrders: false,
        otterStoreId: OTTER_STORE_UUID,
      });
    });

    it('does not call Otter', async () => {
      await service.getStorefrontStatus(RESTAURANT_ID);
      expect(notifyOtterStoreAvailability).not.toHaveBeenCalled();
    });

    it('throws 404 when the restaurant has no connected Otter store', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(null);

      await expect(service.getStorefrontStatus(RESTAURANT_ID)).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('setAvailabilityFromPartner', () => {
    it('pauses locally and reports PAUSED to Otter', async () => {
      await expect(service.setAvailabilityFromPartner(RESTAURANT_ID, false)).resolves.toEqual({
        restaurantID: RESTAURANT_ID,
        isAcceptingOrders: false,
        otterStoreId: OTTER_STORE_UUID,
      });

      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, false);
      // OPERATOR_PAUSED, not PAUSED: Otter's enum has no bare PAUSED, and an unlisted value fails
      // deserialization of the whole body rather than erroring on the field.
      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(OTTER_CLIENT, undefined, expect.objectContaining({ storeState: 'OPERATOR_PAUSED' }));
    });

    it('unpauses locally and reports OPEN to Otter', async () => {
      await service.setAvailabilityFromPartner(RESTAURANT_ID, true);

      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, true);
      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(OTTER_CLIENT, undefined, expect.objectContaining({ storeState: 'OPEN' }));
    });

    it('omits eventResultMetadata for a partner-initiated change', async () => {
      await service.setAvailabilityFromPartner(RESTAURANT_ID, false);

      expect((notifyOtterStoreAvailability as jest.Mock).mock.calls[0][2]).not.toHaveProperty('eventResultMetadata');
    });

    // Otter resolves X-Event-Id against events IT issued, then validates the call as an event result
    // -- reading the state off that stored event instead of our body. An invented id therefore fails
    // with 400 "Successful event result with storeState and statusChangedAt equal to null".
    it('sends no event id for a partner-initiated change', async () => {
      await service.setAvailabilityFromPartner(RESTAURANT_ID, false);

      expect((notifyOtterStoreAvailability as jest.Mock).mock.calls[0][1]).toBeUndefined();
    });

    it('binds the Otter client to our partner store id, not Otter’s store UUID', async () => {
      await service.setAvailabilityFromPartner(RESTAURANT_ID, false);

      expect(createOtterClient).toHaveBeenCalledWith(expect.objectContaining({ storeId: String(RESTAURANT_ID) }));
      expect(createOtterClient).not.toHaveBeenCalledWith(expect.objectContaining({ storeId: OTTER_STORE_UUID }));
    });

    // Local first, then notify: a failed notify leaves us correct and retryable, whereas the inverse
    // order could tell Otter we paused when our own write then failed.
    it('writes local state before notifying Otter', async () => {
      const order: string[] = [];
      (mockRestaurantsService.setRestaurantAcceptingOrders as jest.Mock).mockImplementation(async () => void order.push('local'));
      (notifyOtterStoreAvailability as jest.Mock).mockImplementation(async () => void order.push('otter'));

      await service.setAvailabilityFromPartner(RESTAURANT_ID, false);

      expect(order).toEqual(['local', 'otter']);
    });

    it('propagates a failed notify with local state already applied', async () => {
      (notifyOtterStoreAvailability as jest.Mock).mockRejectedValue(new Error('Otter unreachable'));

      await expect(service.setAvailabilityFromPartner(RESTAURANT_ID, false)).rejects.toThrow('Otter unreachable');
      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, false);
    });

    it('does not touch local state when no Otter store is connected', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(null);

      await expect(service.setAvailabilityFromPartner(RESTAURANT_ID, false)).rejects.toBeInstanceOf(HttpException);
      expect(mockRestaurantsService.setRestaurantAcceptingOrders).not.toHaveBeenCalled();
    });
  });

  describe('handleStorefrontEvent - pause/unpause from Otter', () => {
    it('applies the pause and acknowledges SUCCEEDED on the pause callback', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE));

      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, false);
      expect(notifyOtterPauseResult).toHaveBeenCalledWith(
        OTTER_CLIENT,
        EVENT_ID,
        expect.objectContaining({ eventResultMetadata: expect.objectContaining({ operationStatus: 'SUCCEEDED' }) }),
      );
      expect(notifyOtterUnpauseResult).not.toHaveBeenCalled();
    });

    it('applies the unpause and acknowledges on the unpause callback', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.UNPAUSE_STORE));

      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, true);
      expect(notifyOtterUnpauseResult).toHaveBeenCalledWith(
        OTTER_CLIENT,
        EVENT_ID,
        expect.objectContaining({ eventResultMetadata: expect.objectContaining({ operationStatus: 'SUCCEEDED' }) }),
      );
      expect(notifyOtterPauseResult).not.toHaveBeenCalled();
    });

    // Otter's own state depends on hearing back either way -- silence would leave it waiting.
    it('acknowledges FAILED when the local write fails, then rethrows', async () => {
      (mockRestaurantsService.setRestaurantAcceptingOrders as jest.Mock).mockRejectedValue(new Error('db down'));

      await expect(service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE))).rejects.toThrow('db down');
      expect(notifyOtterPauseResult).toHaveBeenCalledWith(
        OTTER_CLIENT,
        EVENT_ID,
        expect.objectContaining({ eventResultMetadata: expect.objectContaining({ operationStatus: 'FAILED', additionalInformation: 'db down' }) }),
      );
    });

    it('truncates a long failure message so the ack itself cannot 422', async () => {
      (mockRestaurantsService.setRestaurantAcceptingOrders as jest.Mock).mockRejectedValue(new Error('x'.repeat(500)));

      await expect(service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE))).rejects.toThrow();
      const { additionalInformation } = (notifyOtterPauseResult as jest.Mock).mock.calls[0][2].eventResultMetadata;
      expect(additionalInformation).toHaveLength(255);
    });

    it('echoes the inbound eventId so Otter can correlate the result', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE));

      expect((notifyOtterPauseResult as jest.Mock).mock.calls[0][1]).toBe(EVENT_ID);
    });
  });

  describe('handleStorefrontEvent - get availability', () => {
    it.each([
      [true, 'OPEN'],
      [false, 'OPERATOR_PAUSED'],
    ])('reports isAcceptingOrders=%s as %s', async (isAcceptingOrders, storeState) => {
      (mockRestaurantsService.findRestaurantAcceptingOrders as jest.Mock).mockResolvedValue(isAcceptingOrders);

      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_AVAILABILITY));

      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(OTTER_CLIENT, EVENT_ID, expect.objectContaining({ storeState }));
    });

    it('includes SUCCEEDED result metadata when answering a request from Otter', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_AVAILABILITY));

      expect((notifyOtterStoreAvailability as jest.Mock).mock.calls[0][2].eventResultMetadata).toEqual(
        expect.objectContaining({ operationStatus: 'SUCCEEDED' }),
      );
    });

    it('does not change local state', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_AVAILABILITY));

      expect(mockRestaurantsService.setRestaurantAcceptingOrders).not.toHaveBeenCalled();
    });
  });

  describe('handleStorefrontEvent - get hours', () => {
    it('reports mapped restaurant hours for both channels with the address timezone', async () => {
      (mockRestaurantHoursService.findRestaurantHoursByRestaurantID as jest.Mock).mockResolvedValue([{ day: Day.MON, start: '09:00', end: '17:00' }]);

      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_HOURS));

      const expectedRegularHours = [{ dayOfWeek: 'MONDAY', timeRanges: [{ startTime: '09:00', endTime: '17:00' }] }];
      expect(notifyOtterStoreHours).toHaveBeenCalledWith(OTTER_CLIENT, EVENT_ID, {
        storeHoursConfiguration: {
          deliveryHours: { regularHours: expectedRegularHours },
          pickupHours: { regularHours: expectedRegularHours },
          timezone: 'America/Los_Angeles',
        },
        statusChangedAt: expect.any(String),
        eventResultMetadata: expect.objectContaining({ operationStatus: 'SUCCEEDED' }),
      });
    });

    it('still answers with an empty schedule when the restaurant has no hours', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_HOURS));

      expect((notifyOtterStoreHours as jest.Mock).mock.calls[0][2].storeHoursConfiguration.deliveryHours).toEqual({ regularHours: [] });
    });

    // A missing/failed address lookup must not take down the whole hours response.
    it('falls back to a default timezone when the address lookup fails', async () => {
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.Mock).mockRejectedValue(new Error('no address'));

      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_HOURS));

      expect((notifyOtterStoreHours as jest.Mock).mock.calls[0][2].storeHoursConfiguration.timezone).toBe('America/New_York');
    });

    it('repairs the malformed space-separated timezone default before sending', async () => {
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.Mock).mockResolvedValue({ timezone: 'America/New York' });

      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.GET_HOURS));

      expect((notifyOtterStoreHours as jest.Mock).mock.calls[0][2].storeHoursConfiguration.timezone).toBe('America/New_York');
    });
  });

  describe('handleStorefrontEvent - routing', () => {
    it('ignores an unrecognised storefront subtype without calling Otter', async () => {
      await expect(service.handleStorefrontEvent(webhook('storefront.something_new'))).resolves.toBeUndefined();

      expect(notifyOtterPauseResult).not.toHaveBeenCalled();
      expect(notifyOtterStoreAvailability).not.toHaveBeenCalled();
      expect(notifyOtterStoreHours).not.toHaveBeenCalled();
    });
  });

  describe('store resolution', () => {
    it('resolves a store sent as Otter’s UUID', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE, OTTER_STORE_UUID));

      expect(mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform).toHaveBeenCalledWith(OTTER_STORE_UUID, 'otter');
      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, false);
    });

    // The UUID resolves the restaurant, but must not be echoed back as X-Store-Id on the callback.
    it('answers a UUID-addressed webhook with a client bound to our partner store id', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE, OTTER_STORE_UUID));

      expect(createOtterClient).toHaveBeenCalledWith(expect.objectContaining({ storeId: String(RESTAURANT_ID) }));
      expect(createOtterClient).not.toHaveBeenCalledWith(expect.objectContaining({ storeId: OTTER_STORE_UUID }));
    });

    // Otter's docs show storeId as "partner-store-unique-identifier" -- the id we registered, which is
    // String(restaurantID). The UUID-shape guard matters: otter_location_id is a uuid column and a
    // non-UUID value raises 22P02 rather than returning no rows.
    it('resolves a store sent as our own partner store id without querying the uuid column', async () => {
      await service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE, String(RESTAURANT_ID)));

      expect(mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform).not.toHaveBeenCalled();
      expect(mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform).toHaveBeenCalledWith(RESTAURANT_ID, 'otter');
      expect(mockRestaurantsService.setRestaurantAcceptingOrders).toHaveBeenCalledWith(RESTAURANT_ID, false);
    });

    it('does not retry an unknown UUID as a restaurant id, since a UUID is not numeric', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(null);

      await expect(service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE, OTTER_STORE_UUID))).rejects.toBeInstanceOf(HttpException);
      expect(mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform).not.toHaveBeenCalled();
    });

    it('throws 400 when the webhook carries no storeId', async () => {
      await expect(service.handleStorefrontEvent(webhookWithoutStoreId(OTTER_STOREFRONT_EVENT.PAUSE_STORE))).rejects.toBeInstanceOf(HttpException);
    });

    it('throws 404 for a store that maps to no restaurant', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(null);
      (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(null);

      await expect(service.handleStorefrontEvent(webhook(OTTER_STOREFRONT_EVENT.PAUSE_STORE, 'not-a-known-store'))).rejects.toBeInstanceOf(HttpException);
    });
  });
});
