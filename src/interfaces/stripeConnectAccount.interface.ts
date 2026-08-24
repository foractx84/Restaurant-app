import { EntityManager } from 'typeorm';

export interface StripeConnectAccountEntityInterface {
  id?: number;
  restaurant_id: number;
  stripe_account_id: string;
  charges_enabled: boolean;
  details_submitted: boolean;
  onboarding_status: string;
  capabilities?: Record<string, unknown> | string;
  raw_account?: Record<string, unknown> | string;
  created_at?: string;
  updated_at?: string;
}

export interface StripeConnectAccountModelInterface {
  insertStripeConnectAccount: (entity: StripeConnectAccountEntityInterface, repository?: EntityManager) => Promise<void>;
  findByRestaurantId: (restaurantId: number, repository?: EntityManager) => Promise<StripeConnectAccountEntityInterface | null>;
  findByStripeAccountId: (stripeAccountId: string, repository?: EntityManager) => Promise<StripeConnectAccountEntityInterface | null>;
}
