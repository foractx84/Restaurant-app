import { EntityManager } from 'typeorm';
import Stripe from 'stripe';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';

export interface SubscriptionItemServiceInterface {
  createSubscriptionItems: (
    items: Stripe.LineItem[],
    subscriptionID: number,
    isPaid: boolean,
    repository?: EntityManager,
  ) => Promise<SubscriptionItemEntity[]>;
  getSubscriptionItemByStripeCustomerIDAndPackageID: (
    stripeCustomerID: string,
    packageID: number,
    repository?: EntityManager,
  ) => Promise<SubscriptionItemEntity[]>;
  setExpirationDateSubscriptionItems: (items: Stripe.InvoiceLineItem[], repository?: EntityManager) => Promise<void>;
  cancelSubscriptionItems: (subscriptionItemIDs: string[], repository?: EntityManager) => Promise<SubscriptionItemEntity[]>;
  updateSubscriptionItem: (subscriptionItem: SubscriptionItemEntity, restaurantPackageID: number, repository?: EntityManager) => Promise<void>;
}

export interface SubscriptionItemModelInterface {
  insertSubscriptionItems: (subscriptionItems: SubscriptionItemEntity[], repository?: EntityManager) => Promise<SubscriptionItemEntity[]>;
  getSubscriptionItemByStripeCustomerIDAndPackageID: (
    stripeCustomerID: string,
    packageID: number,
    repository?: EntityManager,
  ) => Promise<SubscriptionItemEntity[]>;
  updateSubscriptionItem: (subscriptionItem: SubscriptionItemEntity, repository?: EntityManager) => Promise<void>;
  updateExpirationDateSubscriptionItems: (stripeSubscriptionItemID: string, paymentPlan: string, repository?: EntityManager) => Promise<void>;
  cancelSubscriptionItems: (stripeSubscriptionItemIDs: string[], repository?: EntityManager) => Promise<SubscriptionItemEntity[]>;
}
