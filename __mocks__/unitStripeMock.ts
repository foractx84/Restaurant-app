/**
 * Global Stripe mock for unit tests so that no test ever hits the real Stripe API.
 * Without this, loading stripe.service.ts can instantiate the real Stripe client
 * (module-level `new Stripe(STRIPE.STRIPE_API_KEY)`), and any call to
 * createConnectAccount() would create real Standard Connect accounts on the dashboard.
 */
const mockConnectAccount = {
  id: 'acct_mock_unit_test',
  charges_enabled: false,
  details_submitted: false,
  capabilities: { card_payments: { status: 'pending' }, transfers: { status: 'pending' } },
};
const mockAccountLink = { url: 'https://connect.stripe.com/setup/mock' };

const stripeMock = {
  accounts: {
    create: jest.fn(() => Promise.resolve(mockConnectAccount)),
    retrieve: jest.fn((id: string) =>
      Promise.resolve({
        id: id || 'acct_mock',
        charges_enabled: true,
        details_submitted: true,
        capabilities: { card_payments: { status: 'active' }, transfers: { status: 'active' } },
      }),
    ),
  },
  accountLinks: {
    create: jest.fn(() => Promise.resolve(mockAccountLink)),
  },
  billingPortal: { sessions: { create: jest.fn(() => ({ url: 'https://billing.stripe.com/mock' })) } },
  checkout: {
    sessions: {
      create: jest.fn(() => ({ id: 'cs_mock' })),
      retrieve: jest.fn(() => ({ id: 'cs_mock', customer: 'cus_mock', payment_status: 'paid', status: 'complete' })),
      listLineItems: jest.fn(() => ({ data: [] })),
    },
  },
  subscriptionItems: { list: jest.fn(() => ({ data: [] })) },
};

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn(() => stripeMock),
}));
