import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ManagerEntity } from '@/entities/manager.entity';
import { getCurrentDate } from '@/utils/timeUtils';
import { ormConnection } from '@/utils/dbUtils';
import { StripeCustomerEntity } from '@/entities/stripeCustomer.entity';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';

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
// mock jwt.verify until a test token is generated
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
// mock authService response until Test DB creates proper tables for queries
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn().mockResolvedValue(() => true),
    validateSuperUser: jest.fn().mockResolvedValue(() => true),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    imageUpload: { fields: jest.fn() },
  };
});

const MOCK_URL = 'test_url.com';
const MOCK_SESSION_ID = 'cs_test_a1BY8SdgDgKfxFVxUHizaTEVUiID5GEKp1VOuhQwQdYARcDB0aST5jDOVe';
const MOCK_STRIPE_CUSTOMER_ID = 'some_stripe_customer_id';

jest.mock('stripe', () => {
  const stripeMock = {
    billingPortal: {
      sessions: {
        create: () => ({
          url: MOCK_URL,
        }),
      },
    },
    checkout: {
      sessions: {
        create: () => ({
          id: MOCK_SESSION_ID,
        }),
        retrieve: () => ({
          id: 'test_id',
          customer: 'stripe_customer_id',
          customer_details: {
            email: 'dummy@test.com',
          },
          payment_status: 'paid',
          status: 'complete',
          subscription: 'stripe_subscription_id',
          line_items: {
            data: [
              {
                id: 'stripe_subscription_item_id',
              },
            ],
          },
        }),
      },
    },
    subscriptionItems: {
      list: () => ({
        id: 'subscription_item_test_id',
        object: 'subscription_item',
        data: [
          {
            id: 'subscription_item_id',
            price: {
              id: 'price_id',
            },
          },
        ],
      }),
    },
  };
  return { __esModule: true, default: jest.fn(() => stripeMock) };
});

const mockAuthService = new AuthService(new UsersModel());

describe('Stripe API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValue(true);
  });

  describe('POST /stripe/checkout', () => {
    const checkoutRequestBody = {
      packages: [
        {
          priceID: 'price_1LjpzlI6e6SkqLuRyoDkWtfc',
          quantity: 1,
        },
      ],
    };
    it('should create stripe checkout with user already existing with the managerID via token', async () => {
      const dummyManager: ManagerEntity = await createDummyManager(MOCK_STRIPE_CUSTOMER_ID);
      mockVerify(dummyManager.id);
      const res = await request(app.getServer()).post('/stripe/checkout').set('Authorization', 'token').send(checkoutRequestBody).expect(200);

      await deleteManager(dummyManager.id, MOCK_STRIPE_CUSTOMER_ID);

      expect(res.body).toEqual(MOCK_SESSION_ID);
    });
    it('should create stripe checkout with user not existing', async () => {
      const dummyManager: ManagerEntity = await createDummyManager();
      mockVerify(dummyManager.id);
      const res = await request(app.getServer()).post('/stripe/checkout').set('Authorization', 'token').send(checkoutRequestBody).expect(200);

      await deleteManager(dummyManager.id);

      expect(res.body).toEqual(MOCK_SESSION_ID);
    });
  });
  describe('GET /manager/portal', () => {
    it('should fetch stripe customer portal', async () => {
      const dummyManager: ManagerEntity = await createDummyManager(MOCK_STRIPE_CUSTOMER_ID);
      mockVerify(dummyManager.id);
      const res = await request(app.getServer()).get('/manager/portal').set('Authorization', 'token').expect(200);

      await deleteManager(dummyManager.id, MOCK_STRIPE_CUSTOMER_ID);

      expect(res.body).toEqual(MOCK_URL);
    });
    it('should throw 404 when manager does not have stripe customer id while fetching stripe customer portal', async () => {
      const dummyManager: ManagerEntity = await createDummyManager();
      mockVerify(dummyManager.id);
      await request(app.getServer()).get('/manager/portal').set('Authorization', 'token').expect(404);

      await deleteManager(dummyManager.id);
    });
  });
  describe('GET /packages/checkout?session={CHECKOUT_SESSION_ID}', () => {
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';

    const RESTAURANT_PACKAGE_ID = null;
    const PACKAGE_ID = 1;
    const AMOUNT = 0;
    const TAX_AMOUNT = 0;
    const STATUS = 'active';
    const STRIPE_SUBSCRIPTION_ITEM_ID = 'stripe_subscription_item_id';
    const PRODUCT_PRICE_ID = 1;
    const correctDummySubscription = {
      STRIPE_SUBSCRIPTION_ID,
      STRIPE_CUSTOMER_ID,
      RESTAURANT_PACKAGE_ID,
      PACKAGE_ID,
      AMOUNT,
      TAX_AMOUNT,
      STATUS,
      stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
      PRODUCT_PRICE_ID,
    };
    const EMAIL = 'dummy@test.com';
    it('should get stripe checkout session and return email, stripeCustomerID, and non empty managerPackageID in response', async () => {
      const [dummySubscription, manager, managerPackage] = await createDummySubscriptionAndItems(correctDummySubscription, EMAIL, true, true);

      const expectedResponse = {
        email: manager.email,
        managerPackageIDs: [expect.any(Number)],
        stripeCustomerID: STRIPE_CUSTOMER_ID,
      };

      const res = await request(app.getServer()).get('/packages/checkout?session=cs_test').send().expect(200);

      expect(res.body).toEqual(expectedResponse);

      // cleanup
      await hardDeleteSubscription(dummySubscription, manager, managerPackage, dummySubscription.stripe_customer_id);
    });
    it('should get stripe checkout session and return email, stripeCustomerID, and EMPTY managerPackageID in response', async () => {
      const [dummySubscription, manager, managerPackage] = await createDummySubscriptionAndItems(correctDummySubscription, EMAIL, true, false);

      const expectedResponse = {
        email: manager.email,
        managerPackageIDs: [],
        stripeCustomerID: STRIPE_CUSTOMER_ID,
      };

      const res = await request(app.getServer()).get('/packages/checkout?session=cs_test').send().expect(200);

      expect(res.body).toEqual(expectedResponse);

      // cleanup
      await hardDeleteSubscription(dummySubscription, manager, managerPackage, dummySubscription.stripe_customer_id);
    });
  });
});

const createDummyManager = async (stripeCustomerID?: string, email = 'dummy@test.com'): Promise<ManagerEntity> => {
  const repository = await ormConnection();

  if (stripeCustomerID) {
    await repository.insert(StripeCustomerEntity, {
      stripe_customer_id: stripeCustomerID,
    });
    await repository.insert(ManagerEntity, {
      email: email,
      position_title_id: 6,
      verified_at: getCurrentDate(),
      stripe_customer_id: stripeCustomerID,
    });
  } else {
    await repository.insert(ManagerEntity, {
      email: email,
      position_title_id: 6,
      verified_at: getCurrentDate(),
    });
  }

  return await repository.findOne(ManagerEntity, { email: email });
};

const deleteManager = async (managerID: number, stripeCustomerID?: string) => {
  const repository = await ormConnection();

  await repository.delete(ManagerEntity, {
    id: managerID,
  });

  if (stripeCustomerID) {
    await repository.delete(StripeCustomerEntity, {
      stripe_customer_id: stripeCustomerID,
    });
  }
};

const createDummyManagerPackage = async (managerID: number, packageID: number): Promise<ManagerPackageEntity> => {
  const repository = await ormConnection();
  const managerPackages = await repository.insert(ManagerPackageEntity, { external_user_id: managerID, package_id: packageID });
  return managerPackages.raw[0] as ManagerPackageEntity;
};

const createDummySubscriptionAndItems = async (
  dummySubscription,
  email = 'dummy@test.com',
  createManager = false,
  createManagerPackage = false,
): Promise<SubscriptionEntity | any> => {
  const {
    STRIPE_SUBSCRIPTION_ID,
    STRIPE_CUSTOMER_ID,
    RESTAURANT_PACKAGE_ID,
    PACKAGE_ID,
    AMOUNT,
    TAX_AMOUNT,
    STATUS,
    stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
    PRODUCT_PRICE_ID,
  } = dummySubscription || {};

  const repository = await ormConnection();

  let manager;
  let managerPackage;
  await repository.save(StripeCustomerEntity, { stripe_customer_id: STRIPE_CUSTOMER_ID });
  if (createManager) {
    manager = await createDummyManager(null, email);
    if (createManagerPackage) {
      managerPackage = await createDummyManagerPackage(manager.id, PACKAGE_ID);
    }
  }

  const result = await repository.save(SubscriptionEntity, {
    stripe_subscription_id: STRIPE_SUBSCRIPTION_ID,
    stripe_customer_id: STRIPE_CUSTOMER_ID,
  });
  result.subscription_items = [
    await repository.save(SubscriptionItemEntity, {
      subscription_id: result.subscription_id,
      restaurant_package_id: RESTAURANT_PACKAGE_ID,
      package_id: PACKAGE_ID,
      amount: AMOUNT,
      tax_amount: TAX_AMOUNT,
      status: STATUS,
      stripe_subscription_item_id: STRIPE_SUBSCRIPTION_ITEM_ID,
      price_id: PRODUCT_PRICE_ID,
    }),
  ];
  return [result, manager, managerPackage];
};

const hardDeleteSubscription = async (
  subscription?: SubscriptionEntity,
  manager?: ManagerEntity,
  managerPackage?: ManagerPackageEntity,
  stripeCustomerID?: string,
) => {
  const repository = await ormConnection();
  if (subscription) {
    if (subscription.subscription_items) {
      for (const item of subscription.subscription_items) {
        await repository.delete(SubscriptionItemEntity, { subscription_item_id: item.subscription_item_id });
      }
      await repository.delete(SubscriptionEntity, { subscription_id: subscription.subscription_id });
    }
  }
  if (managerPackage) {
    await repository.delete(ManagerPackageEntity, { manager_package_id: managerPackage.manager_package_id });
  }
  if (manager) {
    await repository.delete(ManagerEntity, { id: manager.id });
  }
  if (stripeCustomerID) {
    await repository.delete(StripeCustomerEntity, { stripe_customer_id: stripeCustomerID });
  }
};

/**
 * set up database items needed for test cases
 * - connect to database
 */
const setUp = async () => {
  await getConnection().connect();
};
/**
 * clean up anything done by test cases
 * - close connections
 */
const cleanUp = async () => {
  await getConnection().close();
};

/**
 * bypass authorization layer
 */
const mockVerify = (managerID = 999) => {
  const decoded = {
    managerID: managerID,
    superUser: false,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
};
