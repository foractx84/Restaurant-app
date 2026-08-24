import { EntityManager } from 'typeorm';

export interface StripeCustomerServiceInterface {
  createStripeCustomer: (stripeCustomerID: string, repository?: EntityManager) => Promise<void>;
}

export interface StripeCustomerModelInterface {
  insertStripeCustomer: (stripeCustomerID: string, repository?: EntityManager) => Promise<void>;
}

export interface StripeCustomerDBInterface {
  id?: number;
  stripe_customer_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}
