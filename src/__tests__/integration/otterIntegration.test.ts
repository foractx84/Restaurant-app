import { app } from '@/server';
import request from 'supertest';
import { EntityManager, getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { OTTER } from '@configs/config';
import { getBoss } from '@queue';
import { ormConnection } from '@/utils/dbUtils';
import { computeOtterWebhookHmac } from '@utils/otterWebhookAuth.util';
import { menuDetailsService, otterIntegrationService, restaurantsService } from '@/routes';
import { OtterMenuSyncJob } from '@interfaces/otterIntegration.interface';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { OtterMenus } from '@interfaces/otter.interface';
import { CreateRestaurantRequestInterface, CreateRestaurantResponseInterface } from '@interfaces/restaurants.interface';
import { Day } from '@enums/day';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { RestaurantHoursEntity } from '@/entities/restaurantHours.entity';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import { PlatformIntegrationEntity } from '@/entities/platformIntegration.entity';
import { StripeConnectAccountEntity } from '@/entities/stripeConnectAccount.entity';
import { MenuEntity } from '@/entities/menus.entity';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { ModifierEntity } from '@/entities/modifier.entity';
import { ModifierGroupToMenuItemLinkEntity } from '@/entities/modifierGroupToMenuItemLink.entity';
import { ModifierToModifierGroupLinkEntity } from '@/entities/modifierToModiferGroupLink.entity';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});

jest.mock('@/configs/config', () => {
  const originalModule = jest.requireActual('@/configs/config');
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'https://dummy_image.jpeg',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };
  return {
    __esModule: true,
    ...originalModule,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});

jest.mock('@/utils/imageUtils', () => {
  const originalModule = jest.requireActual('@/utils/imageUtils');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
    imageUpload: { fields: jest.fn() },
  };
});

jest.mock('@/utils/geocoder', () => ({
  __esModule: true,
  getLatLongGeocoderFromAddress: jest.fn(),
}));

// mock jwt.verify to bypass the authorizationMiddleware used by /otter/menu-push
jest.mock('jsonwebtoken', () => {
  const jwt = { verify: jest.fn() };
  return { __esModule: true, default: jwt };
});

jest.mock('@/services/auth.service', () => {
  const mockAuthService = { validateManager: jest.fn() };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});

// Otter's own Stripe Connect account creation runs for real inside createRestaurantWithoutManager;
// stub the Stripe SDK so tests never hit the real Stripe API.
jest.mock('stripe', () => {
  let createCallCount = 0;
  const stripeMock = {
    accounts: {
      create: jest.fn().mockImplementation(() =>
        Promise.resolve({
          id: `acct_test_${Date.now()}_${++createCallCount}`,
          charges_enabled: false,
          details_submitted: false,
          capabilities: { card_payments: { status: 'pending' }, transfers: { status: 'pending' } },
        }),
      ),
      retrieve: jest.fn().mockImplementation((accountId: string) =>
        Promise.resolve({
          id: accountId,
          charges_enabled: true,
          details_submitted: true,
          capabilities: { card_payments: { status: 'active' }, transfers: { status: 'active' } },
        }),
      ),
    },
    accountLinks: {
      create: jest.fn().mockResolvedValue({ url: 'https://connect.stripe.com/setup/test' }),
    },
  };
  return { __esModule: true, default: jest.fn(() => stripeMock) };
});

// The only module boundary mocked for these tests: real HTTP calls to Otter. Everything else
// (controllers, services, DB writes) runs for real against the seeded test Postgres instance.
jest.mock('@/api/otter.api', () => ({
  __esModule: true,
  exchangeOtterAuthCode: jest.fn(),
  getOtterOrganization: jest.fn(),
  listOtterBrands: jest.fn(),
  listOtterStoresForBrand: jest.fn(),
  getOtterStore: jest.fn(),
  getOtterStoreConnection: jest.fn(),
  createOtterStoreConnection: jest.fn(),
  deleteOtterStoreConnection: jest.fn(),
  createOtterClient: jest.fn(),
  fetchOtterMenu: jest.fn(),
  upsertOtterMenu: jest.fn(),
  getOtterMenuJobStatus: jest.fn(),
}));

import {
  createOtterClient,
  createOtterStoreConnection,
  exchangeOtterAuthCode,
  fetchOtterMenu,
  getOtterMenuJobStatus,
  getOtterStoreConnection,
  listOtterBrands,
  listOtterStoresForBrand,
  upsertOtterMenu,
} from '@/api/otter.api';
import { getLatLongGeocoderFromAddress } from '@/utils/geocoder';

const WEBHOOK_SECRET = 'otter-integration-test-secret';
const mockAuthService = new AuthService(new UsersModel());

const mockVerify = (managerID = 1) => {
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((_token, _secretKey, callback) => callback(null, { managerID }));
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValue(true);
};

/** Creates a real restaurant via the actual service (Stripe mocked), for tests that need one to exist. */
const createTestRestaurant = async (name: string): Promise<CreateRestaurantResponseInterface> => {
  const request: CreateRestaurantRequestInterface = {
    name,
    phone: '0000000000',
    email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@otter-integration-test.taptabapp.com`,
    cuisineID: 1,
    address: { address1: '123 Main St', city: 'Austin', governingDistrict: 'TX', postalCode: '78701', country: 'United States' },
    restaurantHours: [{ day: [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI], start: '10:00', end: '23:00' }],
  };
  return restaurantsService.createRestaurantWithoutManager(request);
};

/** Mirrors the restaurant/platform-integration rows created by Otter onboarding and manual seeding. */
const cleanUpTestRestaurant = async (restaurantID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.transaction(async (conn: EntityManager) => {
    await conn.delete(PlatformIntegrationEntity, { restaurantID });

    const modifierGroups = await conn.find(ModifierGroupEntity, { restaurantID });
    const modifierGroupIDs = modifierGroups.map(group => group.modifierGroupID).filter((id): id is number => id != null);
    if (modifierGroupIDs.length) {
      await conn
        .createQueryBuilder()
        .delete()
        .from(ModifierGroupToMenuItemLinkEntity)
        .where('modifier_group_id IN (:...ids)', { ids: modifierGroupIDs })
        .execute();
      await conn
        .createQueryBuilder()
        .delete()
        .from(ModifierToModifierGroupLinkEntity)
        .where('modifier_group_id IN (:...ids)', { ids: modifierGroupIDs })
        .execute();
    }
    await conn.delete(ModifierGroupEntity, { restaurantID });
    await conn.delete(ModifierEntity, { restaurantID });

    const menus = await conn.find(MenuEntity, { restaurant_id: restaurantID });
    for (const menu of menus) {
      const sections = await conn.find(MenuSectionEntity, { menu_id: menu.menu_id });
      for (const section of sections) {
        await conn.delete(MenuItemEntity, { menu_section_id: section.menu_section_id });
      }
      await conn.delete(MenuSectionEntity, { menu_id: menu.menu_id });
    }
    await conn.delete(MenuEntity, { restaurant_id: restaurantID });
    await conn.delete(RestaurantMenuLayoutEntity, { restaurant_id: restaurantID });
    await conn.delete(RestaurantAddressEntity, { restaurant_id: restaurantID });
    await conn.delete(RestaurantHoursEntity, { restaurant_id: restaurantID });
    await conn.getRepository(StripeConnectAccountEntity).delete({ restaurant_id: restaurantID });
    await conn.delete(RestaurantEntity, { restaurant_id: restaurantID });
  });
};

describe('Otter integration API', () => {
  beforeAll(async () => {
    await getConnection().connect();
    OTTER.WEBHOOK_SECRET = WEBHOOK_SECRET;
  });
  afterAll(async () => await getConnection().close());
  beforeEach(() => {
    (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValue([30.267153, -97.743057]);
  });
  afterEach(() => jest.clearAllMocks());

  describe('POST /otter/webhook', () => {
    it('returns 200 for a valid signature', async () => {
      const payload = { eventId: uuidv4(), eventType: 'menus.publish', metadata: {} };
      const rawBody = JSON.stringify(payload);

      await request(app.getServer())
        .post('/otter/webhook')
        .set('Content-Type', 'application/json')
        .set('x-hmac-sha256', computeOtterWebhookHmac(WEBHOOK_SECRET, rawBody))
        .send(rawBody)
        .expect(200);
    });

    it('returns 401 without enqueuing when the signature is invalid', async () => {
      const rawBody = JSON.stringify({ eventId: uuidv4(), eventType: 'stores.upsert', metadata: {} });

      await request(app.getServer())
        .post('/otter/webhook')
        .set('Content-Type', 'application/json')
        .set('x-hmac-sha256', 'bad-signature')
        .send(rawBody)
        .expect(401);

      expect(getBoss().send).not.toHaveBeenCalled();
    });
  });

  describe('GET /otter/auth/callback', () => {
    it('returns 400 when code is missing', async () => {
      await request(app.getServer()).get('/otter/auth/callback').expect(400);
    });

    it('exchanges the code, connects the single available store, and creates a real restaurant', async () => {
      const otterStoreId = uuidv4();
      const storeName = `${Date.now()}-Otter Connect Test`;

      (exchangeOtterAuthCode as jest.Mock).mockResolvedValue({
        access_token: 'user-token',
        expires_in: 3600,
        scope: 'organization.read organization.service_integration',
        token_type: 'bearer',
        refresh_token: 'refresh-token',
      });
      (listOtterBrands as jest.Mock).mockResolvedValue({ items: [{ id: 'brand-uuid', name: 'Test Brand' }] });
      (listOtterStoresForBrand as jest.Mock).mockResolvedValue({
        items: [
          {
            id: otterStoreId,
            name: storeName,
            address: { fullAddress: '100 Congress Ave, Austin, TX 78701', city: 'Austin', state: 'TX', postalCode: '78701', countryCode: 'US' },
          },
        ],
      });
      (getOtterStoreConnection as jest.Mock).mockResolvedValue(null);
      (createOtterStoreConnection as jest.Mock).mockResolvedValue(undefined);

      let restaurantID: number | undefined;
      try {
        const response = await request(app.getServer()).get('/otter/auth/callback').query({ code: 'test-auth-code' }).expect(200);

        expect(response.body.connected).toBe(true);
        expect(response.body.connection.otterStoreId).toBe(otterStoreId);
        restaurantID = response.body.connection.restaurantID;

        const repository = await ormConnection();
        const restaurant = await repository.findOne(RestaurantEntity, restaurantID);
        expect(restaurant?.name).toBe(storeName);

        const integration = await repository.findOne(PlatformIntegrationEntity, {
          where: { otterLocationID: otterStoreId, externalParty: 'otter' },
        });
        expect(integration?.restaurantID).toBe(restaurantID);

        expect(createOtterStoreConnection).toHaveBeenCalledWith('user-token', 'brand-uuid', otterStoreId, String(restaurantID));
      } finally {
        if (restaurantID) {
          await cleanUpTestRestaurant(restaurantID);
        }
      }
    }, 15000);
  });

  describe('processOtterMenuSyncJob (Otter -> TapTab pull sync)', () => {
    it('fetches, normalizes, and writes a real Otter menu into the database', async () => {
      const otterStoreId = uuidv4();
      const restaurant = await createTestRestaurant(`${Date.now()}-Otter Pull Sync Test`);
      const repository = await ormConnection();
      await repository.save(
        new PlatformIntegrationEntity({
          restaurantID: restaurant.restaurantID,
          accessToken: 'store-token',
          refreshToken: '',
          expiresIn: 3600 * 1000,
          externalParty: 'otter',
          otterLocationID: otterStoreId,
        }),
      );

      const otterMenu: OtterMenus = {
        menus: {
          'menu-1': { id: 'menu-1', name: 'Dinner', categoryIds: ['category-1'], description: 'Evening menu' },
        },
        categories: {
          'category-1': { id: 'category-1', name: 'Entrees', itemIds: ['item-1', 'sold-out-item'] },
        },
        items: {
          'item-1': {
            id: 'item-1',
            name: 'Burger',
            description: 'A burger',
            price: { currencyCode: 'USD', amount: 12.99 },
            status: { saleStatus: 'FOR_SALE' },
            modifierGroupIds: ['temperature-group'],
          },
          // 86'd on Otter's own POS — pull sync should reflect it as hidden in TapTab.
          'sold-out-item': {
            id: 'sold-out-item',
            name: 'Sold Out Salmon',
            price: { currencyCode: 'USD', amount: 18.99 },
            status: { saleStatus: 'INDEFINITELY_NOT_FOR_SALE' },
            modifierGroupIds: [],
          },
          'mod-1': {
            id: 'mod-1',
            name: 'Medium Rare',
            price: { currencyCode: 'USD', amount: 0 },
            status: { saleStatus: 'FOR_SALE' },
          },
        },
        modifierGroups: {
          // Required (radio-button) group — customer must pick exactly one, e.g. steak temperature.
          'temperature-group': {
            id: 'temperature-group',
            name: 'Temperature',
            itemIds: ['mod-1'],
            minimumSelections: 1,
            maximumSelections: 1,
          },
        },
      };

      (createOtterClient as jest.Mock).mockReturnValue({});
      (fetchOtterMenu as jest.Mock).mockResolvedValue(otterMenu);

      const job: OtterMenuSyncJob = { eventId: uuidv4(), restaurantID: restaurant.restaurantID, otterStoreId };

      try {
        await otterIntegrationService.processOtterMenuSyncJob([{ data: job } as any]);

        const createdMenus = await repository.find(MenuEntity, { restaurant_id: restaurant.restaurantID });
        expect(createdMenus).toHaveLength(1);
        expect(createdMenus[0].name).toBe('Dinner');

        const createdSections = await repository.find(MenuSectionEntity, { menu_id: createdMenus[0].menu_id });
        expect(createdSections.map(section => section.name)).toEqual(['Entrees']);

        const createdItems = await repository.find(MenuItemEntity, { menu_section_id: createdSections[0].menu_section_id });
        expect(createdItems).toHaveLength(2);
        const burger = createdItems.find(item => item.name === 'Burger');
        const soldOut = createdItems.find(item => item.name === 'Sold Out Salmon');
        expect(burger.is_hidden).toBe(false);
        expect(soldOut.is_hidden).toBe(true);

        const createdModifierGroups = await repository.find(ModifierGroupEntity, { restaurantID: restaurant.restaurantID });
        expect(createdModifierGroups).toHaveLength(1);
        expect(createdModifierGroups[0].name).toBe('Temperature');
        expect(createdModifierGroups[0].minimumSelections).toBe(1);
        expect(createdModifierGroups[0].maximumSelections).toBe(1);
      } finally {
        await cleanUpTestRestaurant(restaurant.restaurantID);
      }
    }, 15000);
  });

  describe('POST /otter/menu-push (TapTab -> Otter push)', () => {
    it('reads the real restaurant menu from the database and sends a correctly-built payload to Otter', async () => {
      const otterStoreId = uuidv4();
      const restaurant = await createTestRestaurant(`${Date.now()}-Otter Push Test`);
      const repository = await ormConnection();
      await repository.save(
        new PlatformIntegrationEntity({
          restaurantID: restaurant.restaurantID,
          accessToken: 'store-token',
          refreshToken: '',
          expiresIn: 3600 * 1000,
          externalParty: 'otter',
          otterLocationID: otterStoreId,
        }),
      );

      // Seed real menu data via the same normalized-menu write path the pull-sync job uses, so this
      // test exercises "does the push read real DB rows correctly" independent of how they got there.
      const normalizedMenus: NormalizedMenu[] = [
        {
          id: 'seed-menu',
          name: 'Push Test Menu',
          description: '',
          hours: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
          sections: [
            {
              id: 'seed-section',
              name: 'Mains',
              description: '',
              items: [
                {
                  id: 'seed-item',
                  name: 'Pizza',
                  description: 'A pizza',
                  price: 1899,
                  modifierGroups: [
                    {
                      id: 'seed-group',
                      name: 'Toppings',
                      modifiers: [
                        { id: 'seed-modifier', name: 'Extra Cheese', description: '', price: 200 },
                        // 86'd -- the push payload must still include it (with the correct hidden
                        // status), not omit it. Otter's upsert is full-replacement; an omitted-but-
                        // existing entity tells Otter to DELETE it, not mark it unavailable.
                        { id: 'seed-hidden-modifier', name: 'Anchovies', description: '', price: 300, isHidden: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      let capturedRequestBody: unknown;
      (upsertOtterMenu as jest.Mock).mockImplementation((_client, requestBody) => {
        capturedRequestBody = requestBody;
        return Promise.resolve({ jobReference: { id: 'job-1', status: 'SUCCESS' } });
      });
      (createOtterClient as jest.Mock).mockReturnValue({});
      (getOtterMenuJobStatus as jest.Mock).mockResolvedValue({ jobReference: { id: 'job-1', status: 'SUCCESS' } });
      // pushMenuToOtter now forces a resync (syncOtterMenuForRestaurant) before gathering the push
      // payload -- explicitly mock fetchOtterMenu to an empty response for THIS test's store, rather
      // than inheriting whatever the pull-sync test above left it mocked to. An empty Otter menu with
      // no existing 'otter' snapshot for this restaurant takes the "no snapshot -> initialize" branch
      // with zero normalized menus, which is a harmless no-op -- it doesn't touch the menu already
      // seeded below via createMenusDetailsFromNormalized.
      (fetchOtterMenu as jest.Mock).mockResolvedValue({ menus: {}, categories: {}, items: {}, modifierGroups: {} });

      try {
        await menuDetailsService.createMenusDetailsFromNormalized(normalizedMenus, restaurant.restaurantID, null);

        mockVerify();
        const response = await request(app.getServer())
          .post('/otter/menu-push')
          .set('Authorization', 'token')
          .set('restaurantID', String(restaurant.restaurantID))
          .expect(202);

        expect(response.body).toEqual({ jobId: 'job-1', status: 'SUCCESS' });
        expect(upsertOtterMenu).toHaveBeenCalledTimes(1);

        const body = capturedRequestBody as {
          menus: Record<string, any>;
          categories: Record<string, any>;
          items: Record<string, any>;
          modifierGroups: Record<string, any>;
        };
        expect(Object.values(body.menus).map((menu: any) => menu.name)).toEqual(['Push Test Menu']);
        expect(Object.values(body.categories).map((category: any) => category.name)).toEqual(['Mains']);

        const pizzaItem = Object.values(body.items).find((item: any) => item.name === 'Pizza') as any;
        expect(pizzaItem).toMatchObject({ name: 'Pizza', description: 'A pizza', price: { currencyCode: 'USD', amount: 18.99 } });

        const cheeseModifier = Object.values(body.items).find((item: any) => item.name === 'Extra Cheese') as any;
        expect(cheeseModifier).toMatchObject({ price: { currencyCode: 'USD', amount: 2 } });

        // Every entity here was seeded via createMenusDetailsFromNormalized, which sets external_id
        // from the normalized id (matching how a real pull sync from Otter would populate it) --
        // proving the push payload targets Otter's own ids ('seed-*'), not TapTab's internal numeric
        // PKs. Otter's POST /v1/menus is a full-replacement upsert keyed by id; pushing the wrong id
        // for an entity that already exists in Otter creates a duplicate instead of updating it.
        expect(pizzaItem.id).toBe('seed-item');
        expect(cheeseModifier.id).toBe('seed-modifier');
        expect(Object.keys(body.menus)).toEqual(['seed-menu']);
        expect(Object.keys(body.categories)).toEqual(['seed-section']);
        expect(body.items[pizzaItem.id].modifierGroupIds).toEqual(['seed-group']);
        expect(body.modifierGroups['seed-group'].itemIds).toEqual(['seed-modifier', 'seed-hidden-modifier']);

        const anchoviesModifier = body.items['seed-hidden-modifier'];
        expect(anchoviesModifier).toMatchObject({ name: 'Anchovies', status: { saleStatus: 'INDEFINITELY_NOT_FOR_SALE' } });
      } finally {
        await cleanUpTestRestaurant(restaurant.restaurantID);
      }
    }, 15000);
  });
});
