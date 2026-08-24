import {
  createOtterClient,
  exchangeOtterAuthCode,
  fetchOtterMenu,
  getOtterMenuJobStatus,
  getOtterStore,
  notifyOtterPauseStoreResult,
  notifyOtterStoreAvailability,
  notifyOtterStoreHours,
  notifyOtterUnpauseStoreResult,
  upsertOtterMenu,
} from '@/api/otter.api';
import OtterIntegrationService from '@/services/otterIntegration.service';
import { OtterAuthServiceInterface, OtterOrganizationServiceInterface } from '@interfaces/otter.interface';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantMenuSnapshotServiceInterface } from '@interfaces/restaurantMenuSnapshot.interface';
import { MenuDetailsServiceInterface } from '@interfaces/menuDetails.interface';
import { MenusModelsInterface, MenusServiceInterface } from '@interfaces/menus.interface';
import { MenuHoursServiceInterface } from '@interfaces/menuHours.interface';
import { ModifierGroupModelInterface } from '@interfaces/modifierGroup.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';
import { normalizeOtterMenus, stringifyNormalizedMenus } from '@utils/normalize';
import { generateHash } from '@utils/hashUtils';
import { acquireAdvisoryLock } from '@utils/advisoryLock';
import { ormConnection } from '@utils/dbUtils';
import { getBoss } from '@queue';
import { MenuSyncProcessor } from '@menu-sync/processor/menu-sync.processor';

jest.mock('@/api/otter.api', () => ({
  exchangeOtterAuthCode: jest.fn(),
  getOtterStore: jest.fn(),
  createOtterClient: jest.fn(),
  fetchOtterMenu: jest.fn(),
  upsertOtterMenu: jest.fn(),
  getOtterMenuJobStatus: jest.fn(),
  notifyOtterPauseStoreResult: jest.fn(),
  notifyOtterStoreAvailability: jest.fn(),
  notifyOtterStoreHours: jest.fn(),
  notifyOtterUnpauseStoreResult: jest.fn(),
}));

jest.mock('@utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@utils/normalize', () => ({
  normalizeOtterMenus: jest.fn(),
  stringifyNormalizedMenus: jest.fn(),
}));

jest.mock('@utils/hashUtils', () => ({
  generateHash: jest.fn(),
}));

jest.mock('@utils/advisoryLock', () => ({
  acquireAdvisoryLock: jest.fn(),
}));

jest.mock('@utils/dbUtils', () => ({
  ormConnection: jest.fn(),
}));

jest.mock('@menu-sync/context-factory', () => ({
  buildMenuSyncContext: jest.fn().mockReturnValue({}),
}));

jest.mock('@menu-sync/processor/menu-sync.processor', () => ({
  MenuSyncProcessor: jest.fn().mockImplementation(() => ({ process: jest.fn() })),
}));

const STORE = {
  id: 'otter-store-uuid',
  name: 'Otter Cafe',
  address: { fullAddress: '100 Main St', city: 'Austin', state: 'TX', postalCode: '78701', countryCode: 'US' },
};

describe('OtterIntegrationService', () => {
  const mockPlatformIntegrationService: PlatformIntegrationServiceInterface = {
    createPlatformIntegration: jest.fn(),
    updatePlatformIntegration: jest.fn(),
    getPlatformIntegrationByLocationIDAndPlatform: jest.fn(),
    getPlatformIntegrationByStoreIDAndPlatform: jest.fn(),
    getPlatformIntegrationByRestaurantIDAndPlatform: jest.fn(),
    getAllConnectedPlatformIntegrations: jest.fn(),
  };

  const mockRestaurantService = {
    createRestaurantWithoutManager: jest.fn(),
    findRestaurantEntityByNameAndAddress: jest.fn(),
    findRestaurantEntityByID: jest.fn(),
    findRestaurantEntityWithHoursAndAddressByID: jest.fn(),
    updateRestaurantEntity: jest.fn(),
  } as unknown as RestaurantsServiceInterface;

  const mockOrganizationService: OtterOrganizationServiceInterface = {
    listSelectableStores: jest.fn(),
    connectStore: jest.fn(),
  };

  const mockOtterAuthService: OtterAuthServiceInterface = {
    acquireAndStoreToken: jest.fn(),
    getValidAccessToken: jest.fn(),
  };

  const mockRestaurantMenuSnapshotService: RestaurantMenuSnapshotServiceInterface = {
    createMenuSnapshot: jest.fn(),
    getLatestMenuSnapshot: jest.fn(),
  };

  const mockMenuDetailsService = {
    createMenusDetailsFromNormalized: jest.fn(),
  } as unknown as MenuDetailsServiceInterface;

  const mockMenusService = {
    getMenuDetails: jest.fn(),
  } as unknown as MenusServiceInterface;

  const mockMenusModel = {
    getMenusEntitiesByRestaurantID: jest.fn(),
  } as unknown as MenusModelsInterface;

  const mockMenuHoursService = {
    getMenuHoursByMenuID: jest.fn(),
  } as unknown as MenuHoursServiceInterface;

  const mockModifierGroupModel = {
    fetchModifierGroupsByRestaurantID: jest.fn(),
  } as unknown as ModifierGroupModelInterface;

  let service: OtterIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    (exchangeOtterAuthCode as jest.Mock).mockResolvedValue({
      access_token: 'user-token',
      expires_in: 3600,
      scope: 'organization.read',
      token_type: 'bearer',
      refresh_token: 'refresh',
    });
    (getOtterStore as jest.Mock).mockResolvedValue(STORE);
    (mockOrganizationService.listSelectableStores as jest.Mock).mockResolvedValue([{ brandId: 'brand-1', brandName: 'Brand', store: STORE }]);
    (mockOrganizationService.connectStore as jest.Mock).mockResolvedValue(undefined);
    (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(null);
    (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(null);
    (mockPlatformIntegrationService.getAllConnectedPlatformIntegrations as jest.Mock).mockResolvedValue([]);
    (mockRestaurantService.findRestaurantEntityByNameAndAddress as jest.Mock).mockResolvedValue(null);
    (mockRestaurantService.createRestaurantWithoutManager as jest.Mock).mockResolvedValue({ restaurantID: 42 });
    (mockRestaurantService.findRestaurantEntityWithHoursAndAddressByID as jest.Mock).mockResolvedValue(undefined);
    (mockRestaurantService.updateRestaurantEntity as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterPauseStoreResult as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterUnpauseStoreResult as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterStoreAvailability as jest.Mock).mockResolvedValue(undefined);
    (notifyOtterStoreHours as jest.Mock).mockResolvedValue(undefined);
    (mockPlatformIntegrationService.createPlatformIntegration as jest.Mock).mockResolvedValue({});
    (mockRestaurantMenuSnapshotService.getLatestMenuSnapshot as jest.Mock).mockResolvedValue(null);
    (mockRestaurantMenuSnapshotService.createMenuSnapshot as jest.Mock).mockResolvedValue({});
    (mockMenuDetailsService.createMenusDetailsFromNormalized as jest.Mock).mockResolvedValue(undefined);
    (acquireAdvisoryLock as jest.Mock).mockResolvedValue({ acquired: true, release: jest.fn().mockResolvedValue(undefined) });
    (createOtterClient as jest.Mock).mockReturnValue({});
    (fetchOtterMenu as jest.Mock).mockResolvedValue({ menus: {}, categories: {}, items: {}, modifierGroups: {} });
    (normalizeOtterMenus as jest.Mock).mockReturnValue([]);
    (stringifyNormalizedMenus as jest.Mock).mockReturnValue('[]');
    (generateHash as jest.Mock).mockReturnValue('hash-1');
    (ormConnection as jest.Mock).mockResolvedValue({ transaction: jest.fn(async (cb: (manager: unknown) => Promise<void>) => cb({})) });
    (mockMenusModel.getMenusEntitiesByRestaurantID as jest.Mock).mockResolvedValue([]);
    (mockMenusService.getMenuDetails as jest.Mock).mockResolvedValue({});
    (mockMenuHoursService.getMenuHoursByMenuID as jest.Mock).mockResolvedValue([]);
    (mockModifierGroupModel.fetchModifierGroupsByRestaurantID as jest.Mock).mockResolvedValue([]);
    (upsertOtterMenu as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'PENDING' } });
    (getOtterMenuJobStatus as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'SUCCESS' } });

    service = new OtterIntegrationService(
      mockPlatformIntegrationService,
      mockRestaurantService,
      mockOrganizationService,
      mockOtterAuthService,
      mockRestaurantMenuSnapshotService,
      mockMenuDetailsService,
      mockMenusService,
      mockMenusModel,
      mockMenuHoursService,
      mockModifierGroupModel,
    );
  });

  describe('handleOtterWebhook', () => {
    it('acknowledges events with no eventType without enqueueing a sync', async () => {
      await expect(
        service.handleOtterWebhook({ eventId: 'e1', eventType: undefined as unknown as string, metadata: { storeId: 'otter-store-uuid' } }),
      ).resolves.toBeUndefined();

      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('acknowledges order events without enqueueing a sync, even for a known connected store', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      await service.handleOtterWebhook({ eventId: 'e1', eventType: 'orders.create', metadata: { storeId: 'otter-store-uuid' } });

      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('acknowledges the legacy stores.upsert event without enqueueing a sync', async () => {
      await expect(
        service.handleOtterWebhook({ eventId: 'e1', eventType: 'stores.upsert', metadata: { storeId: 'otter-store-uuid' } }),
      ).resolves.toBeUndefined();

      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('acknowledges menu-update events with no storeId without enqueueing a sync', async () => {
      await expect(service.handleOtterWebhook({ eventId: 'e1', eventType: 'menus.publish', metadata: {} })).resolves.toBeUndefined();

      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('acknowledges menu-update events for an unconnected store without enqueueing a sync', async () => {
      await expect(
        service.handleOtterWebhook({ eventId: 'e1', eventType: 'menus.publish', metadata: { storeId: 'unknown-store' } }),
      ).resolves.toBeUndefined();

      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('enqueues a menu sync for a menu-update event on a known, connected store', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      await service.handleOtterWebhook({ eventId: 'e1', eventType: 'menus.publish', metadata: { storeId: 'otter-store-uuid' } });

      expect(getBoss().send).toHaveBeenCalledWith(
        'otter.menu-sync',
        { eventId: 'e1', restaurantID: 7, otterStoreId: 'otter-store-uuid' },
        { singletonKey: 'store-otter-store-uuid', singletonNextSlot: true },
      );
    });

    it('pauses the mapped restaurant when Otter sends storefront.pause_store', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      await service.handleOtterWebhook({
        eventId: 'pause-event-1',
        eventType: 'storefront.pause_store',
        metadata: {
          storeId: 'otter-store-uuid',
          resourceId: 'closure-123',
        },
      });

      expect(mockRestaurantService.updateRestaurantEntity).toHaveBeenCalledWith(
        { is_accepting_orders: false },
        7,
      );

      expect(createOtterClient).toHaveBeenCalledWith({
        authService: mockOtterAuthService,
        storeId: 'otter-store-uuid',
      });

      expect(notifyOtterPauseStoreResult).toHaveBeenCalledWith(
        otterClient,
        'pause-event-1',
        expect.objectContaining({
          closureId: 'closure-123',
          eventResultMetadata: expect.objectContaining({
            operationStatus: 'SUCCEEDED',
          }),
        }),
      );
    });

    it('unpauses the mapped restaurant when Otter sends storefront.unpause_store', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      await service.handleOtterWebhook({
        eventId: 'unpause-event-1',
        eventType: 'storefront.unpause_store',
        metadata: {
          storeId: 'otter-store-uuid',
          payload: 'closure-123',
        },
      });

      expect(mockRestaurantService.updateRestaurantEntity).toHaveBeenCalledWith(
        { is_accepting_orders: true },
        7,
      );

      expect(notifyOtterUnpauseStoreResult).toHaveBeenCalledWith(
        otterClient,
        'unpause-event-1',
        expect.objectContaining({
          eventResultMetadata: expect.objectContaining({
            operationStatus: 'SUCCEEDED',
          }),
        }),
      );
    });

    it('reports OPEN when the mapped restaurant is accepting orders', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityByID as jest.Mock).mockResolvedValue({
        restaurant_id: 7,
        is_accepting_orders: true,
      });

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      await service.handleOtterWebhook({
        eventId: 'availability-event-1',
        eventType: 'storefront.get_store_availability',
        metadata: {
          storeId: 'otter-store-uuid',
        },
      });

      expect(mockRestaurantService.findRestaurantEntityByID).toHaveBeenCalledWith(7);

      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(
        otterClient,
        'availability-event-1',
        expect.objectContaining({
          storeState: 'OPEN',
          statusChangedAt: null,
          eventResultMetadata: expect.objectContaining({
            operationStatus: 'SUCCEEDED',
          }),
        }),
      );
    });

    it('reports OPERATOR_PAUSED when the mapped restaurant is not accepting orders', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityByID as jest.Mock).mockResolvedValue({
        restaurant_id: 7,
        is_accepting_orders: false,
      });

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      await service.handleOtterWebhook({
        eventId: 'availability-event-2',
        eventType: 'storefront.get_store_availability',
        metadata: {
          storeId: 'otter-store-uuid',
        },
      });

      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(
        otterClient,
        'availability-event-2',
        expect.objectContaining({
          storeState: 'OPERATOR_PAUSED',
          statusChangedAt: null,
          eventResultMetadata: expect.objectContaining({
            operationStatus: 'SUCCEEDED',
          }),
        }),
      );
    });

    it('reports restaurant hours when Otter sends storefront.get_store_hours', async () => {
      (
        mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock
      ).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityWithHoursAndAddressByID as jest.Mock).mockResolvedValue({
        restaurant_id: 7,
        hours: [
          {
            day: 'Monday',
            start: '08:00',
            end: '17:00',
          },
          {
            day: 'Tuesday',
            start: '09:00',
            end: '18:00',
          },
        ],
        restaurant_address: {
          timezone: 'America/New_York',
        },
      });

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      await service.handleOtterWebhook({
        eventId: 'hours-event-1',
        eventType: 'storefront.get_store_hours',
        metadata: {
          storeId: 'otter-store-uuid',
        },
      });

      expect(mockRestaurantService.findRestaurantEntityWithHoursAndAddressByID).toHaveBeenCalledWith(7);

      expect(createOtterClient).toHaveBeenCalledWith({
        authService: mockOtterAuthService,
        storeId: 'otter-store-uuid',
      });

      expect(notifyOtterStoreHours).toHaveBeenCalledWith(
        otterClient,
        'hours-event-1',
        expect.objectContaining({
          storeHoursConfiguration: expect.objectContaining({
            timezone: 'America/New_York',
            deliveryHours: {
              regularHours: [
                {
                  dayOfWeek: 'MONDAY',
                  timeRanges: [
                    {
                      startTime: '08:00',
                      endTime: '17:00',
                    },
                  ],
                },
                {
                  dayOfWeek: 'TUESDAY',
                  timeRanges: [
                    {
                      startTime: '09:00',
                      endTime: '18:00',
                    },
                  ],
                },
              ],
              specialHours: [],
            },
            pickupHours: {
              regularHours: [
                {
                  dayOfWeek: 'MONDAY',
                  timeRanges: [
                    {
                      startTime: '08:00',
                      endTime: '17:00',
                    },
                  ],
                },
                {
                  dayOfWeek: 'TUESDAY',
                  timeRanges: [
                    {
                      startTime: '09:00',
                      endTime: '18:00',
                    },
                  ],
                },
              ],
              specialHours: [],
            },
          }),
          statusChangedAt: null,
          eventResultMetadata: expect.objectContaining({
            operationStatus: 'SUCCEEDED',
          }),
        }),
      );
    });

    it('does not report hours when the mapped restaurant no longer exists', async () => {
      (
        mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock
      ).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityWithHoursAndAddressByID as jest.Mock).mockResolvedValue(undefined);

      await service.handleOtterWebhook({
        eventId: 'hours-event-missing',
        eventType: 'storefront.get_store_hours',
        metadata: {
          storeId: 'otter-store-uuid',
        },
      });

      expect(notifyOtterStoreHours).not.toHaveBeenCalled();
    });

    it('ignores Storefront events for an unconnected Otter store', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleOtterWebhook({
          eventId: 'pause-event-unknown',
          eventType: 'storefront.pause_store',
          metadata: {
            storeId: 'unknown-store',
          },
        }),
      ).resolves.toBeUndefined();

      expect(mockRestaurantService.updateRestaurantEntity).not.toHaveBeenCalled();
      expect(notifyOtterPauseStoreResult).not.toHaveBeenCalled();
    });
  });

  describe('updateStorefrontAvailability', () => {
    it('pauses the restaurant and notifies Otter', async () => {
      (
        mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock
      ).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityByID as jest.Mock).mockResolvedValue({
        restaurant_id: 7,
        is_accepting_orders: true,
      });

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      const result = await service.updateStorefrontAvailability(7, false);

      expect(mockRestaurantService.updateRestaurantEntity).toHaveBeenCalledWith(
        { is_accepting_orders: false },
        7,
      );

      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(
        otterClient,
        expect.any(String),
        expect.objectContaining({
          storeState: 'OPERATOR_PAUSED',
          statusChangedAt: expect.any(String),
          eventResultMetadata: expect.objectContaining({
            operationStatus: 'SUCCEEDED',
          }),
        }),
      );

      expect(result).toEqual({
        isAcceptingOrders: false,
        storeState: 'OPERATOR_PAUSED',
      });
    });

    it('unpauses the restaurant and notifies Otter', async () => {
      (
        mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock
      ).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityByID as jest.Mock).mockResolvedValue({
        restaurant_id: 7,
        is_accepting_orders: false,
      });

      const otterClient = {};
      (createOtterClient as jest.Mock).mockReturnValue(otterClient);

      const result = await service.updateStorefrontAvailability(7, true);

      expect(mockRestaurantService.updateRestaurantEntity).toHaveBeenCalledWith(
        { is_accepting_orders: true },
        7,
      );

      expect(notifyOtterStoreAvailability).toHaveBeenCalledWith(
        otterClient,
        expect.any(String),
        expect.objectContaining({
          storeState: 'OPEN',
        }),
      );

      expect(result).toEqual({
        isAcceptingOrders: true,
        storeState: 'OPEN',
      });
    });

    it('throws 404 when the restaurant has no connected Otter store', async () => {
      (
        mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.updateStorefrontAvailability(7, false),
      ).rejects.toMatchObject({
        status: 404,
      });

      expect(mockRestaurantService.updateRestaurantEntity).not.toHaveBeenCalled();
      expect(notifyOtterStoreAvailability).not.toHaveBeenCalled();
    });

    it('rolls back the local state when notifying Otter fails', async () => {
      (
        mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock
      ).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      (mockRestaurantService.findRestaurantEntityByID as jest.Mock).mockResolvedValue({
        restaurant_id: 7,
        is_accepting_orders: true,
      });

      (notifyOtterStoreAvailability as jest.Mock).mockRejectedValue(
        new Error('Otter unavailable'),
      );

      await expect(
        service.updateStorefrontAvailability(7, false),
      ).rejects.toThrow('Otter unavailable');

      expect(mockRestaurantService.updateRestaurantEntity).toHaveBeenNthCalledWith(
        1,
        { is_accepting_orders: false },
        7,
      );

      expect(mockRestaurantService.updateRestaurantEntity).toHaveBeenNthCalledWith(
        2,
        { is_accepting_orders: true },
        7,
      );
    });
  });

  describe('triggerManualMenuSync', () => {
    it('throws 404 when the restaurant has no connected Otter store', async () => {
      await expect(service.triggerManualMenuSync(99)).rejects.toMatchObject({ status: 404 });
      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('enqueues a sync and returns enqueued:true when a store is connected', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );

      const result = await service.triggerManualMenuSync(7);

      expect(result).toEqual({ enqueued: true });
      expect(getBoss().send).toHaveBeenCalledWith('otter.menu-sync', expect.objectContaining({ restaurantID: 7, otterStoreId: 'otter-store-uuid' }), {
        singletonKey: 'store-otter-store-uuid',
        singletonNextSlot: true,
      });
    });
  });

  describe('pushMenuToOtter', () => {
    it('throws 404 when the restaurant has no connected Otter store', async () => {
      await expect(service.pushMenuToOtter(99)).rejects.toMatchObject({ status: 404 });
      expect(upsertOtterMenu).not.toHaveBeenCalled();
    });

    it('gathers the restaurant menu, pushes it to Otter, and returns the resolved job status', async () => {
      jest.useFakeTimers();
      try {
        (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(
          new PlatformIntegrationEntity({
            restaurantID: 7,
            accessToken: 'token',
            refreshToken: '',
            expiresIn: 1,
            externalParty: 'otter',
            otterLocationID: 'otter-store-uuid',
          }),
        );
        (mockMenusModel.getMenusEntitiesByRestaurantID as jest.Mock).mockResolvedValue([{ menu_id: 1 }]);
        (mockMenusService.getMenuDetails as jest.Mock).mockResolvedValue({ menuID: 1, menuName: 'Dinner', menuSections: [] });
        (mockMenuHoursService.getMenuHoursByMenuID as jest.Mock).mockResolvedValue([]);
        (mockModifierGroupModel.fetchModifierGroupsByRestaurantID as jest.Mock).mockResolvedValue([]);
        (upsertOtterMenu as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'PENDING' } });
        (getOtterMenuJobStatus as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'SUCCESS' } });

        const resultPromise = service.pushMenuToOtter(7);
        await jest.advanceTimersByTimeAsync(1000);
        const result = await resultPromise;

        expect(mockMenusModel.getMenusEntitiesByRestaurantID).toHaveBeenCalledWith(7);
        expect(upsertOtterMenu).toHaveBeenCalledWith(
          {},
          expect.objectContaining({ menus: { '1': expect.objectContaining({ id: '1', name: 'Dinner' }) } }),
        );
        expect(getOtterMenuJobStatus).toHaveBeenCalledWith({}, 'job-1');
        expect(result).toEqual({ jobId: 'job-1', status: 'SUCCESS' });
      } finally {
        jest.useRealTimers();
      }
    });

    it('stops polling and returns PENDING once the poll attempts are exhausted', async () => {
      jest.useFakeTimers();
      try {
        (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(
          new PlatformIntegrationEntity({
            restaurantID: 7,
            accessToken: 'token',
            refreshToken: '',
            expiresIn: 1,
            externalParty: 'otter',
            otterLocationID: 'otter-store-uuid',
          }),
        );
        (upsertOtterMenu as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'PENDING' } });
        (getOtterMenuJobStatus as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'PENDING' } });

        const resultPromise = service.pushMenuToOtter(7);
        await jest.advanceTimersByTimeAsync(5 * 1000);
        const result = await resultPromise;

        expect(result).toEqual({ jobId: 'job-1', status: 'PENDING' });
        expect(getOtterMenuJobStatus).toHaveBeenCalledTimes(5);
      } finally {
        jest.useRealTimers();
      }
    });

    it('resyncs from Otter (fetches the live menu) before gathering the push payload, so push never re-sends stale availability', async () => {
      // Availability is pull-authoritative -- Otter owns it. Push is triggered by unrelated manager
      // edits and could otherwise fire in the narrow gap right after a very recent Otter-side 86,
      // re-sending stale availability back to Otter and undoing it. pushMenuToOtter forces a
      // synchronous resync (the same syncOtterMenuForRestaurant path processOtterMenuSyncJob uses)
      // immediately before gathering the push payload to close that gap.
      jest.useFakeTimers();
      try {
        (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(
          new PlatformIntegrationEntity({
            restaurantID: 7,
            accessToken: 'token',
            refreshToken: '',
            expiresIn: 1,
            externalParty: 'otter',
            otterLocationID: 'otter-store-uuid',
          }),
        );
        (mockMenusModel.getMenusEntitiesByRestaurantID as jest.Mock).mockResolvedValue([]);
        (upsertOtterMenu as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'PENDING' } });
        (getOtterMenuJobStatus as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'SUCCESS' } });

        const resultPromise = service.pushMenuToOtter(7);
        await jest.advanceTimersByTimeAsync(1000);
        await resultPromise;

        expect(createOtterClient).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'otter-store-uuid' }));
        expect(fetchOtterMenu).toHaveBeenCalled();
        // Ordering matters, not just "both were called" -- a resync that ran AFTER gathering the push
        // payload wouldn't close the staleness gap this exists to fix.
        const fetchOrder = (fetchOtterMenu as jest.Mock).mock.invocationCallOrder[0];
        const gatherOrder = (mockMenusModel.getMenusEntitiesByRestaurantID as jest.Mock).mock.invocationCallOrder[0];
        expect(fetchOrder).toBeLessThan(gatherOrder);
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not push when the pre-push resync fails, rather than risk sending stale availability', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'token',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );
      (fetchOtterMenu as jest.Mock).mockRejectedValue(new Error('Otter API unreachable'));

      await expect(service.pushMenuToOtter(7)).rejects.toThrow('Otter API unreachable');

      expect(mockMenusModel.getMenusEntitiesByRestaurantID).not.toHaveBeenCalled();
      expect(upsertOtterMenu).not.toHaveBeenCalled();
    });
  });

  describe('processOtterMenuSyncScan', () => {
    it('enqueues a sync for every connected store', async () => {
      (mockPlatformIntegrationService.getAllConnectedPlatformIntegrations as jest.Mock).mockResolvedValue([
        new PlatformIntegrationEntity({
          restaurantID: 1,
          accessToken: 'a',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'store-1',
        }),
        new PlatformIntegrationEntity({
          restaurantID: 2,
          accessToken: 'b',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'store-2',
        }),
      ]);

      await service.processOtterMenuSyncScan();

      expect(mockPlatformIntegrationService.getAllConnectedPlatformIntegrations).toHaveBeenCalledWith('otter');
      expect(getBoss().send).toHaveBeenCalledTimes(2);
      expect(getBoss().send).toHaveBeenCalledWith('otter.menu-sync', expect.objectContaining({ restaurantID: 1, otterStoreId: 'store-1' }), {
        singletonKey: 'store-store-1',
        singletonNextSlot: true,
      });
      expect(getBoss().send).toHaveBeenCalledWith('otter.menu-sync', expect.objectContaining({ restaurantID: 2, otterStoreId: 'store-2' }), {
        singletonKey: 'store-store-2',
        singletonNextSlot: true,
      });
    });

    it('skips rows missing restaurantID or otterLocationID without enqueueing', async () => {
      (mockPlatformIntegrationService.getAllConnectedPlatformIntegrations as jest.Mock).mockResolvedValue([
        new PlatformIntegrationEntity({ restaurantID: null, accessToken: 'a', refreshToken: '', expiresIn: 1, externalParty: 'otter' }),
        new PlatformIntegrationEntity({ restaurantID: 3, accessToken: 'b', refreshToken: '', expiresIn: 1, externalParty: 'otter' }),
      ]);

      await service.processOtterMenuSyncScan();

      expect(getBoss().send).not.toHaveBeenCalled();
    });

    it('logs and continues when one store fails to enqueue', async () => {
      (mockPlatformIntegrationService.getAllConnectedPlatformIntegrations as jest.Mock).mockResolvedValue([
        new PlatformIntegrationEntity({
          restaurantID: 1,
          accessToken: 'a',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'store-1',
        }),
        new PlatformIntegrationEntity({
          restaurantID: 2,
          accessToken: 'b',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'store-2',
        }),
      ]);
      (getBoss().send as jest.Mock).mockRejectedValueOnce(new Error('queue unavailable')).mockResolvedValueOnce('job-id');

      await expect(service.processOtterMenuSyncScan()).resolves.toBeUndefined();

      expect(getBoss().send).toHaveBeenCalledTimes(2);
    });
  });

  describe('processOtterMenuSyncJob', () => {
    const job = { data: { eventId: 'e1', restaurantID: 7, otterStoreId: 'otter-store-uuid' } };

    it('skips the run when the advisory lock is not acquired', async () => {
      (acquireAdvisoryLock as jest.Mock).mockResolvedValue({ acquired: false, release: jest.fn() });

      await service.processOtterMenuSyncJob([job as never]);

      expect(fetchOtterMenu).not.toHaveBeenCalled();
    });

    it('initializes menus when no prior snapshot exists', async () => {
      (mockRestaurantMenuSnapshotService.getLatestMenuSnapshot as jest.Mock).mockResolvedValue(null);

      await service.processOtterMenuSyncJob([job as never]);

      expect(mockMenuDetailsService.createMenusDetailsFromNormalized).toHaveBeenCalledWith([], 7, null, {});
      expect(mockRestaurantMenuSnapshotService.createMenuSnapshot).toHaveBeenCalledWith(7, [], 'hash-1', 'otter', {});
    });

    it('no-ops when the snapshot hash is unchanged', async () => {
      (mockRestaurantMenuSnapshotService.getLatestMenuSnapshot as jest.Mock).mockResolvedValue({ menuHash: 'hash-1', menuJson: [] });

      await service.processOtterMenuSyncJob([job as never]);

      expect(mockMenuDetailsService.createMenusDetailsFromNormalized).not.toHaveBeenCalled();
      expect(mockRestaurantMenuSnapshotService.createMenuSnapshot).not.toHaveBeenCalled();
    });

    it('runs the sync processor when the snapshot hash differs', async () => {
      (mockRestaurantMenuSnapshotService.getLatestMenuSnapshot as jest.Mock).mockResolvedValue({ menuHash: 'old-hash', menuJson: [] });

      await service.processOtterMenuSyncJob([job as never]);

      const processorInstance = (MenuSyncProcessor as unknown as jest.Mock).mock.results[0].value;
      expect(processorInstance.process).toHaveBeenCalledWith([], [], 7, null, {});
      expect(mockRestaurantMenuSnapshotService.createMenuSnapshot).toHaveBeenCalledWith(7, [], 'hash-1', 'otter', {});
    });

    it('releases the advisory lock even when the sync fails', async () => {
      const release = jest.fn().mockResolvedValue(undefined);
      (acquireAdvisoryLock as jest.Mock).mockResolvedValue({ acquired: true, release });
      (fetchOtterMenu as jest.Mock).mockRejectedValue(new Error('Otter API error'));

      await expect(service.processOtterMenuSyncJob([job as never])).rejects.toThrow('Otter API error');

      expect(release).toHaveBeenCalled();
    });
  });

  describe('handleOAuthWithAuthCode', () => {
    it('auto-connects when exactly one store is available', async () => {
      const result = await service.handleOAuthWithAuthCode('auth-code');

      expect(result.connected).toBe(true);
      expect(result.connection).toEqual(expect.objectContaining({ restaurantID: 42, otterStoreId: 'otter-store-uuid', brandId: 'brand-1' }));
      expect(mockOrganizationService.connectStore).toHaveBeenCalledWith('user-token', 'brand-1', 'otter-store-uuid', '42');
      expect(mockPlatformIntegrationService.createPlatformIntegration).toHaveBeenCalledWith(
        42,
        'user-token',
        'refresh',
        3600,
        'otter',
        null,
        'otter-store-uuid',
      );
    });

    it('returns selectable stores when multiple exist and none was selected', async () => {
      (mockOrganizationService.listSelectableStores as jest.Mock).mockResolvedValue([
        { brandId: 'brand-1', brandName: 'Brand', store: STORE },
        { brandId: 'brand-1', brandName: 'Brand', store: { ...STORE, id: 'other-store', name: 'Other' } },
      ]);

      const result = await service.handleOAuthWithAuthCode('auth-code');

      expect(result.connected).toBe(false);
      expect(result.selectableStores).toHaveLength(2);
      expect(mockRestaurantService.createRestaurantWithoutManager).not.toHaveBeenCalled();
    });

    it('connects the selected store when brandId and storeId are provided', async () => {
      const result = await service.handleOAuthWithAuthCode('auth-code', 'brand-1', 'otter-store-uuid');

      expect(result.connected).toBe(true);
      expect(getOtterStore).toHaveBeenCalledWith('user-token', 'brand-1', 'otter-store-uuid');
      expect(mockOrganizationService.connectStore).toHaveBeenCalled();
    });

    it('reuses an existing platform integration instead of creating a duplicate restaurant', async () => {
      (mockPlatformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform as jest.Mock).mockResolvedValue(
        new PlatformIntegrationEntity({
          restaurantID: 7,
          accessToken: 'old',
          refreshToken: '',
          expiresIn: 1,
          externalParty: 'otter',
          otterLocationID: 'otter-store-uuid',
        }),
      );
      (mockRestaurantService.findRestaurantEntityByID as jest.Mock).mockResolvedValue({ restaurant_id: 7, name: 'Existing' });

      const result = await service.handleOAuthWithAuthCode('auth-code', 'brand-1', 'otter-store-uuid');

      expect(result.connection?.restaurantID).toBe(7);
      expect(mockRestaurantService.createRestaurantWithoutManager).not.toHaveBeenCalled();
      expect(mockOrganizationService.connectStore).toHaveBeenCalledWith('user-token', 'brand-1', 'otter-store-uuid', '7');
    });
  });
});
