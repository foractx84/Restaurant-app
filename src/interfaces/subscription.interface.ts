import { EntityManager } from 'typeorm';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import Stripe from 'stripe';

export interface SubscriptionServiceInterface {
  createSubscription: (
    stripeSubscriptionID: string,
    items: Stripe.LineItem[],
    stripeCustomerID: string,
    isPaid: boolean,
    repository?: EntityManager,
  ) => Promise<SubscriptionEntity>;
  getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID: (
    stripeSubscriptionID: string,
    repository?: EntityManager,
  ) => Promise<SubscriptionEntity[]>;
}

export interface SubscriptionModelInterface {
  getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID: (
    stripeSubscriptionID: string,
    repository?: EntityManager,
  ) => Promise<SubscriptionEntity[]>;
  insertSubscription: (subscription: SubscriptionEntity, repository?: EntityManager) => Promise<SubscriptionEntity>;
}
