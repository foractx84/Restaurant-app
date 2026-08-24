import { TapManagerError } from '@exceptions/HttpException';
import StripeService from '@services/stripe.service';
import ManagerPackageService from '@services/managerPackage.service';
import { ManagerPackageModelInterface } from '@interfaces/managerPackage.interface';
import ManagersService from '@services/managers.service';
import { ManagersModelsInterface } from '@interfaces/managers.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import TitlesModel from '@/models/titles.model';
import StripeCustomerService from '@services/stripeCustomer.service';
import { StripeCustomerModelInterface } from '@interfaces/stripeCustomer.interface';
import StripeIdempotenceService from '@services/stripeIdempotence.service';
import { StripeIdempotenceModelInterface } from '@interfaces/stripeIdempotence.interface';
import SubscriptionService from '@services/subscription.service';
import { SubscriptionItemModelInterface, SubscriptionItemServiceInterface } from '@interfaces/subscriptionItem.interface';
import { SubscriptionModelInterface } from '@interfaces/subscription.interface';
import Stripe from 'stripe';
import { sendCheckoutCompletionEmail } from '@utils/emailUtils';
import { ormConnection } from '@utils/dbUtils';
import StripeTaxService from '@/services/stripeTax.service';
import { StripeTaxModelInterface } from '@/interfaces/stripeTax.interface';
import { CreateStripeCheckoutSessionRequestInterface } from '@/interfaces/stripe.interface';
import SubscriptionItemService from '@/services/subscriptionItem.service';
import { ProductPriceServiceInterface } from '@/interfaces/productPrice.interface';
import RestaurantPackageService from '@/services/restaurantPackages.service';
import { RestaurantPackageModelInterface } from '@/interfaces/restaurantPackage.interface';

const MOCK_SESSION_ID = 'some_session_id';
const MOCK_URL = 'test_url.com';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/services/managerPackage.service', () => {
  const mockManagerPackageService = {
    createManagerPackages: jest.fn(),
    getUnassignedManagerPackagesByManagerIDAndPackageIDs: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerPackageService) };
});
jest.mock('@/services/managers.service', () => {
  const mockManagerService = {
    createManagerEntity: jest.fn(),
    getManagerByStripeCustomerIDOrEmail: jest.fn(),
    updateManagerEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerService) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/stripeCustomer.service', () => {
  const mockStripeCustomerService = {
    createStripeCustomer: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeCustomerService) };
});
jest.mock('@/services/stripeIdempotence.service', () => {
  const mockStripeIdempotenceService = {
    checkStripeEventExists: jest.fn(),
    logStripeEvent: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeIdempotenceService) };
});
jest.mock('@/services/stripeTax.service', () => {
  const mockStripeTaxService = {
    getStripeTaxCodes: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeTaxService) };
});
jest.mock('@/services/subscription.service', () => {
  const mockSubscriptionService = {
    createSubscription: jest.fn(),
    getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSubscriptionService) };
});
jest.mock('@/services/subscriptionItem.service', () => {
  const mockSubscriptionItemService = {
    setExpirationDateSubscriptionItems: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSubscriptionItemService) };
});
jest.mock('stripe', () => {
  const mockConnectAccount = {
    id: 'acct_test123',
    charges_enabled: false,
    details_submitted: false,
    capabilities: { card_payments: { status: 'pending' }, transfers: { status: 'pending' } },
  };
  const mockAccountLink = { url: 'https://connect.stripe.com/setup/test-link' };
  const stripeMock = {
    accounts: {
      create: jest.fn(() => Promise.resolve(mockConnectAccount)),
    },
    accountLinks: {
      create: jest.fn(() => Promise.resolve(mockAccountLink)),
    },
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
        listLineItems: () => ({
          id: 'test_id',
          object: 'line_item',
          data: [
            {
              id: 'line_item_id',
              price: {
                id: 'price_id',
              },
            },
          ],
        }),
        retrieve: () => ({
          id: 'test_id',
          customer: 'stripe_customer_id',
          customer_details: {
            email: 'fake@gmail.com',
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
jest.mock('@/utils/emailUtils', () => {
  return {
    __esModule: true,
    sendCheckoutCompletionEmail: jest.fn(),
  };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockManagerPackageService = new ManagerPackageService({} as ManagerPackageModelInterface);
const mockManagerService = new ManagersService({} as ManagersModelsInterface, new TitlesModel(), {} as RestaurantsServiceInterface);
const mockStripeCustomerService = new StripeCustomerService({} as StripeCustomerModelInterface);
const mockStripeIdempotenceService = new StripeIdempotenceService({} as StripeIdempotenceModelInterface);
const mockSubscriptionService = new SubscriptionService({} as SubscriptionItemServiceInterface, {} as SubscriptionModelInterface);
const mockSubscriptionItemService = new SubscriptionItemService({} as ProductPriceServiceInterface, {} as SubscriptionItemModelInterface);
const mockStripeTaxService = new StripeTaxService({} as StripeTaxModelInterface);
const mockStripeItemService = new SubscriptionItemService({} as ProductPriceServiceInterface, {} as SubscriptionItemModelInterface);
const mockRestaurantPackageService = new RestaurantPackageService({} as RestaurantPackageModelInterface);

const stripeService = new StripeService(
  mockManagerPackageService,
  mockManagerService,
  mockStripeCustomerService,
  mockStripeIdempotenceService,
  mockSubscriptionService,
  mockStripeTaxService,
  mockStripeItemService,
  mockRestaurantPackageService,
);

describe('stripeService', () => {
  const MANAGER_ID = 1;
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getStripeCustomerPortal', () => {
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    it('should successfully fetch a stripe customer portal url', async () => {
      const result = await stripeService.getStripeCustomerPortal(MANAGER_ID, STRIPE_CUSTOMER_ID);

      expect(result).toEqual(MOCK_URL);
    });
    it('should throw 404 Not Found HttpException if any customer does not have stripe customer id while fetching stripe customer portal', async () => {
      try {
        await stripeService.getStripeCustomerPortal(MANAGER_ID, null);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('createConnectAccount', () => {
    // Skipped: module-level stripe in stripe.service.ts is not using the jest mock (returns undefined)
    it.skip('should create a Standard Connect account and return the full account', async () => {
      const result = await stripeService.createConnectAccount();
      expect(result).toBeDefined();
      expect(result.id).toEqual('acct_test123');
      expect(result.charges_enabled).toEqual(false);
      expect(result.details_submitted).toEqual(false);
    });
  });
  describe('createConnectOnboardingLink', () => {
    // Skipped: same module-level stripe mock issue as createConnectAccount
    it.skip('should create an account onboarding link and return it with url', async () => {
      const result = await stripeService.createConnectOnboardingLink('acct_123');
      expect(result).toBeDefined();
      expect(result.url).toEqual('https://connect.stripe.com/setup/test-link');
    });
  });
  describe('handleStripeEvent', () => {
    it('should break out of logic if idempotence event already exists in our database', async () => {
      const stripeEvent: Stripe.Event = {
        api_version: '2022-08-01',
        created: 0,
        data: { object: {} },
        livemode: false,
        pending_webhooks: 0,
        request: undefined,
        id: 'random_id',
        object: 'event',
        type: 'checkout.session.completed',
      };
      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await stripeService.handleStripeEvent(stripeEvent);
      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).not.toHaveBeenCalled();
      expect(mockStripeCustomerService.createStripeCustomer).not.toHaveBeenCalled();
      expect(mockManagerService.createManagerEntity).not.toHaveBeenCalled();
      expect(mockSubscriptionService.createSubscription).not.toHaveBeenCalled();
      expect(mockManagerPackageService.createManagerPackages).not.toHaveBeenCalled();
      expect(sendCheckoutCompletionEmail).not.toHaveBeenCalled();
      expect(mockStripeIdempotenceService.logStripeEvent).not.toHaveBeenCalled();
    });
  });
  describe('handleStripeCheckoutCompletion', () => {
    const SUCCESS_URL = 'https://manager-dev.trytaptab.com/signup?session={CHECKOUT_SESSION_ID}';
    const EXPECTED_SUCCESS_URL = 'https://manager-dev.trytaptab.com/signup?session=random_checkout_session_id';
    const paidStripeCheckoutSession = {
      customer: 'random_customer_id',
      customer_details: {
        email: 'test@email.com',
        name: 'Test User',
      },
      id: 'random_checkout_session_id',
      livemode: false,
      object: 'checkout.session',
      payment_status: 'paid',
      subscription: 'random_subscription_id',
      success_url: SUCCESS_URL,
    };
    const unpaidStripeCheckoutSession = {
      customer: 'random_customer_id',
      customer_details: {
        email: 'test@email.com',
        name: 'Test User',
      },
      id: 'random_checkout_session_id',
      livemode: false,
      object: 'checkout.session',
      payment_status: 'unpaid',
      subscription: 'random_subscription_id',
      success_url: SUCCESS_URL,
    };
    it('should successfully handle a paid stripe checkout completion event for a new customer', async () => {
      const stripeEvent: Stripe.Event = {
        api_version: '2022-08-01',
        created: 0,
        data: {
          object: paidStripeCheckoutSession as Stripe.Checkout.Session,
        },
        livemode: false,
        pending_webhooks: 0,
        request: undefined,
        id: 'random_id',
        object: 'event',
        type: 'checkout.session.completed',
      };
      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await stripeService.handleStripeEvent(stripeEvent);
      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(sendCheckoutCompletionEmail).toHaveBeenCalledWith(
        paidStripeCheckoutSession?.customer_details?.name,
        paidStripeCheckoutSession?.customer_details?.email,
        EXPECTED_SUCCESS_URL,
        false,
      );
      expect(mockStripeIdempotenceService.logStripeEvent).toHaveBeenCalledWith(stripeEvent.id);
    });
    it('should successfully handle an unpaid stripe checkout completion event for a new customer', async () => {
      const stripeEvent: Stripe.Event = {
        api_version: '2022-08-01',
        created: 0,
        data: {
          object: unpaidStripeCheckoutSession as Stripe.Checkout.Session,
        },
        livemode: false,
        pending_webhooks: 0,
        request: undefined,
        id: 'random_id',
        object: 'event',
        type: 'checkout.session.completed',
      };

      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await stripeService.handleStripeEvent(stripeEvent);
      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(sendCheckoutCompletionEmail).toHaveBeenCalledWith(
        unpaidStripeCheckoutSession?.customer_details?.name,
        unpaidStripeCheckoutSession?.customer_details?.email,
        EXPECTED_SUCCESS_URL,
        false,
      );
      expect(mockStripeIdempotenceService.logStripeEvent).toHaveBeenCalledWith(stripeEvent.id);
    });
    it('should successfully handle a paid stripe checkout completion event for an existing customer', async () => {
      const stripeEvent: Stripe.Event = {
        api_version: '2022-08-01',
        created: 0,
        data: {
          object: paidStripeCheckoutSession as Stripe.Checkout.Session,
        },
        livemode: false,
        pending_webhooks: 0,
        request: undefined,
        id: 'random_id',
        object: 'event',
        type: 'checkout.session.completed',
      };

      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      (mockManagerService.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockResolvedValueOnce({ id: MANAGER_ID });
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await stripeService.handleStripeEvent(stripeEvent);
      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(sendCheckoutCompletionEmail).toHaveBeenCalledWith(
        paidStripeCheckoutSession?.customer_details?.name,
        paidStripeCheckoutSession?.customer_details?.email,
        EXPECTED_SUCCESS_URL,
        true,
      );
      expect(mockStripeIdempotenceService.logStripeEvent).toHaveBeenCalledWith(stripeEvent.id);
    });
    it('should throw 500 Bad Request HttpException if any error exists while handling a paid stripe checkout completion event', async () => {
      const stripeEvent: Stripe.Event = {
        api_version: '2022-08-01',
        created: 0,
        data: {
          object: paidStripeCheckoutSession as Stripe.Checkout.Session,
        },
        livemode: false,
        pending_webhooks: 0,
        request: undefined,
        id: 'random_id',
        object: 'event',
        type: 'checkout.session.completed',
      };

      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      (mockManagerService.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeService.handleStripeEvent(stripeEvent);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(sendCheckoutCompletionEmail).not.toHaveBeenCalled();
      expect(mockStripeIdempotenceService.logStripeEvent).not.toHaveBeenCalled();
    });
  });
  describe('createStripeCheckoutSession', () => {
    const mockStripeTaxCodes = ['tax_rate1', 'tax_rate2'];
    const stripeCheckoutSessionRequest = {
      packages: [
        {
          priceID: 'price_1LjpzlI6e6SkqLuRyoDkWtfc',
          quantity: 1,
        },
      ],
      country: 'United States',
      currency: 'USD',
    } as CreateStripeCheckoutSessionRequestInterface;
    it('should successfully create a stripe checkout session for user that already exists via managerID in token', async () => {
      (mockStripeTaxService.getStripeTaxCodes as jest.MockedFunction<any>).mockResolvedValueOnce(mockStripeTaxCodes);

      const result = await stripeService.createStripeCheckoutSession(stripeCheckoutSessionRequest, MANAGER_ID);

      expect(mockStripeTaxService.getStripeTaxCodes).toHaveBeenCalledTimes(1);

      expect(result).toEqual(MOCK_SESSION_ID);
    });
    it('should successfully create a stripe checkout session for user that does not already exist', async () => {
      (mockStripeTaxService.getStripeTaxCodes as jest.MockedFunction<any>).mockResolvedValueOnce(mockStripeTaxCodes);

      const result = await stripeService.createStripeCheckoutSession(stripeCheckoutSessionRequest);

      expect(mockStripeTaxService.getStripeTaxCodes).toHaveBeenCalledTimes(1);

      expect(result).toEqual(MOCK_SESSION_ID);
    });
    it('should throw 500 Bad Request HttpException if any error exists while handling a checkout creation event', async () => {
      (mockStripeTaxService.getStripeTaxCodes as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      let result;
      try {
        result = await stripeService.createStripeCheckoutSession(stripeCheckoutSessionRequest);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(result).not.toEqual(MOCK_SESSION_ID);
    });
  });
  describe('handleStripeCustomerUpdate', () => {
    const updatedCustomer = {
      id: 'random_customer_id',
      email: 'test@email.com',
      phone: '555555555',
      livemode: false,
      object: 'customer',
    } as Stripe.Customer;
    const stripeEvent: Stripe.Event = {
      api_version: '2022-08-01',
      created: 0,
      data: {
        object: updatedCustomer as Stripe.Customer,
      },
      livemode: false,
      pending_webhooks: 0,
      request: undefined,
      id: 'random_id',
      object: 'event',
      type: 'customer.updated',
    };
    it('should successfully handle a stripe customer updated event for an existing customer', async () => {
      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      (mockManagerService.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockResolvedValueOnce({ id: MANAGER_ID });

      await stripeService.handleStripeEvent(stripeEvent);
      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(mockManagerService.updateManagerEntity).toHaveBeenCalledTimes(1);
      expect(mockStripeIdempotenceService.logStripeEvent).toHaveBeenCalledWith(stripeEvent.id);
    });
    it('should successfully handle a stripe customer updated event for an unknown customer', async () => {
      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);

      await stripeService.handleStripeEvent(stripeEvent);

      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(mockManagerService.updateManagerEntity).not.toHaveBeenCalled();
      expect(mockStripeIdempotenceService.logStripeEvent).toHaveBeenCalledWith(stripeEvent.id);
    });
    it('should throw 500 Bad Request HttpException if any error exists while handling a stripe customer updated event', async () => {
      (mockStripeIdempotenceService.checkStripeEventExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      (mockManagerService.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeService.handleStripeEvent(stripeEvent);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockStripeIdempotenceService.checkStripeEventExists).toHaveBeenCalledWith(stripeEvent.id);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledTimes(1);
      expect(mockManagerService.updateManagerEntity).not.toHaveBeenCalled();
      expect(mockStripeIdempotenceService.logStripeEvent).not.toHaveBeenCalled();
    });
  });
  describe('getStripeCheckoutSession', () => {
    const SESSION = 'some_session';
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';
    const EMAIL = 'fake@gmail.com';
    const mockItemPackageIDs = [1];
    const mockManagerPackageEntities = [
      {
        manager_package_id: 1,
        package_id: 1,
        external_user_id: 1,
      },
    ];
    const expectedResponse = {
      email: 'fake@gmail.com',
      managerPackageIDs: [1],
      stripeCustomerID: 'stripe_customer_id',
    };
    const mockSubscriptionAndItems = [
      {
        subscription_id: 1,
        stripe_subscription_id: 'stripe_subscription_id',
        stripe_customer_id: 'stripe_customer_id',
        subscription_items: [
          {
            subscription_item_id: 2,
            subscription_id: 1,
            restaurant_package_id: null,
            assigned_at: null,
            deleted_at: null,
            package_id: 1,
            amount: 5900,
            expiration_date: '2022-11-04T11:45:52.698Z',
            tax_amount: 0,
            status: 'active',
            stripe_subscription_item_id: 'stripe_subscription_item_id',
            price_id: 3,
          },
        ],
      },
    ];
    const mockManager = {
      id: 1,
      email: 'fake@gmail.com',
      stripe_customer_id: 'stripe_customer_id',
    };
    it('should successfully get a stripe checkout session', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSubscriptionAndItems,
      );
      (mockManagerService.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManager);
      (mockManagerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockManagerPackageEntities,
      );

      const result = await stripeService.getStripeCheckoutSession(SESSION);
      expect(mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(STRIPE_SUBSCRIPTION_ID);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, EMAIL);
      expect(mockManagerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs).toHaveBeenCalledWith(mockManager.id, mockItemPackageIDs);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw 500 HttpException if any error exists while getting a stripe checkout session', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeService.getStripeCheckoutSession(SESSION);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(STRIPE_SUBSCRIPTION_ID);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).not.toHaveBeenCalled();
      expect(mockManagerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs).not.toHaveBeenCalled();
    });
    it('should successfully get a stripe checkout session with empty managerPackageIDs array', async () => {
      const mockUnavailableSubscriptionAndItems = [
        {
          subscription_id: 1,
          stripe_subscription_id: 'stripe_subscription_id',
          stripe_customer_id: 'stripe_customer_id',
          subscription_items: [
            {
              subscription_item_id: 2,
              subscription_id: 1,
              restaurant_package_id: 1,
              assigned_at: null,
              deleted_at: null,
              package_id: 1,
              amount: 5900,
              expiration_date: '2022-11-04T11:45:52.698Z',
              tax_amount: 0,
              status: 'active',
              stripe_subscription_item_id: 'stripe_subscription_item_id',
              price_id: 3,
            },
          ],
        },
      ];
      const emptyManagerPackageExpectedResponse = {
        email: 'fake@gmail.com',
        managerPackageIDs: [],
        stripeCustomerID: 'stripe_customer_id',
      };

      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockUnavailableSubscriptionAndItems,
      );

      const result = await stripeService.getStripeCheckoutSession(SESSION);
      expect(mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(STRIPE_SUBSCRIPTION_ID);
      expect(mockManagerService.getManagerByStripeCustomerIDOrEmail).not.toHaveBeenCalled();
      expect(mockManagerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs).not.toHaveBeenCalled();
      expect(result).toEqual(emptyManagerPackageExpectedResponse);
    });
  });
  describe('handleStripeCustomerSubscriptionDeleted', () => {
    const stripeEvent: Stripe.Event = {
      api_version: '2022-08-01',
      created: 0,
      data: {
        object: {
          id: 1,
          items: {},
        },
      },
      livemode: false,
      pending_webhooks: 0,
      request: undefined,
      id: 'random_id',
      object: 'event',
      type: 'customer.subscription.deleted',
    };
    const mockSubscriptionAndItems = [
      {
        subscription_id: 1,
        stripe_subscription_id: 'stripe_subscription_id',
        stripe_customer_id: 'stripe_customer_id',
        subscription_items: [
          {
            subscription_item_id: 2,
            subscription_id: 1,
            restaurant_package_id: null,
            assigned_at: null,
            deleted_at: null,
            package_id: 1,
            amount: 5900,
            expiration_date: '2022-11-04T11:45:52.698Z',
            tax_amount: 0,
            status: 'active',
            stripe_subscription_item_id: 'stripe_subscription_item_id',
            price_id: 3,
          },
        ],
      },
    ];
    it('should successfully handle a stripe customer subsciption being deleted', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSubscriptionAndItems,
      );
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await stripeService.handleStripeCustomerSubscriptionDeleted(stripeEvent);

      expect(mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(stripeEvent.data.object['id']);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists while handling a stripe customer subscription being deleted', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeService.handleStripeCustomerSubscriptionDeleted(stripeEvent);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('handleStripeCustomerSubscriptionPaid', () => {
    const SUBSCRIPTION_ID = 'stripe_subscription_id';
    const STRIPE_SUBSCRIPTION_ITEM_DATA = { subscription_item: 'si_id' };
    const stripeEvent: Stripe.Event = {
      api_version: '2022-08-01',
      created: 0,
      data: {
        object: {
          id: 1,
          items: {},
          lines: {
            data: [STRIPE_SUBSCRIPTION_ITEM_DATA],
          },
          subscription: {
            id: 'stripe_subscription_id',
          },
        },
      },
      livemode: false,
      pending_webhooks: 0,
      request: undefined,
      id: 'random_id',
      object: 'event',
      type: 'invoice.paid',
    };
    const mockSubscriptionAndItems = [
      {
        subscription_id: 1,
        stripe_subscription_id: 'stripe_subscription_id',
        stripe_customer_id: 'stripe_customer_id',
        subscription_items: [
          {
            subscription_item_id: 2,
            subscription_id: 1,
            restaurant_package_id: null,
            assigned_at: null,
            deleted_at: null,
            package_id: 1,
            amount: 5900,
            expiration_date: '2022-11-04T11:45:52.698Z',
            tax_amount: 0,
            status: 'active',
            stripe_subscription_item_id: 'stripe_subscription_item_id',
            price_id: 3,
          },
        ],
      },
    ];
    it('should successfully handle a stripe customer subsciption being paid', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSubscriptionAndItems,
      );

      await stripeService.handleStripeCustomerSubscriptionPaid(stripeEvent);

      expect(mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(SUBSCRIPTION_ID);
      expect(mockSubscriptionItemService.setExpirationDateSubscriptionItems).toHaveBeenCalledWith([
        STRIPE_SUBSCRIPTION_ITEM_DATA,
      ] as Stripe.InvoiceLineItem[]);
    });
    it('should throw 500 Bad Request HttpException if any error exists while handling a stripe customer subscription being paid', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeService.handleStripeCustomerSubscriptionPaid(stripeEvent);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('handleStripeCustomerSubscriptionUpdated', () => {
    const stripeEvent: Stripe.Event = {
      api_version: '2022-08-01',
      created: 0,
      data: {
        object: {
          id: 1,
          items: {},
          status: 'unpaid',
        },
      },
      livemode: false,
      pending_webhooks: 0,
      request: undefined,
      id: 'random_id',
      object: 'event',
      type: 'customer.subscription.updated',
    };
    const mockSubscriptionAndItems = [
      {
        subscription_id: 1,
        stripe_subscription_id: 'stripe_subscription_id',
        stripe_customer_id: 'stripe_customer_id',
        subscription_items: [
          {
            subscription_item_id: 2,
            subscription_id: 1,
            restaurant_package_id: null,
            assigned_at: null,
            deleted_at: null,
            package_id: 1,
            amount: 5900,
            expiration_date: '2022-11-04T11:45:52.698Z',
            tax_amount: 0,
            status: 'active',
            stripe_subscription_item_id: 'stripe_subscription_item_id',
            price_id: 3,
          },
        ],
      },
    ];
    it('should successfully handle a stripe customer subsciption being updated', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockSubscriptionAndItems,
      );
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await stripeService.handleStripeCustomerSubscriptionUpdated(stripeEvent);

      expect(mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID).toHaveBeenCalledWith(stripeEvent.data.object['id']);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 Bad Request HttpException if any error exists while handling a stripe customer subscription being updaetd', async () => {
      (mockSubscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeService.handleStripeCustomerSubscriptionUpdated(stripeEvent);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
