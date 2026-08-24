import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { CreateStripeCheckoutSessionRequestInterface, GetStripeCheckoutSessionResponse, StripeServiceInterface } from '@interfaces/stripe.interface';
import { STRIPE } from '@/configs/config';
import { StripeCustomerServiceInterface } from '@interfaces/stripeCustomer.interface';
import Stripe from 'stripe';
import { ManagerEntity } from '@/entities/manager.entity';
import { StripeTaxServiceInterface } from '@/interfaces/stripeTax.interface';
import { StripeTaxEntity } from '@/entities/stripeTax.entity';
import { StripeIdempotenceServiceInterface } from '@interfaces/stripeIdempotence.interface';
import { ManagersServiceInterface } from '@interfaces/managers.interface';
import { SubscriptionServiceInterface } from '@interfaces/subscription.interface';
import { ManagerPackageServiceInterface } from '@interfaces/managerPackage.interface';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';
import { sendCheckoutCompletionEmail } from '@utils/emailUtils';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { SubscriptionItemServiceInterface } from '@/interfaces/subscriptionItem.interface';
import { RestaurantPackageServiceInterface } from '@/interfaces/restaurantPackage.interface';

const stripe = new Stripe(STRIPE.STRIPE_API_KEY, {
  apiVersion: '2022-08-01',
  typescript: true,
});

class StripeService implements StripeServiceInterface {
  private managerPackageService: ManagerPackageServiceInterface;
  private managerService: ManagersServiceInterface;
  private stripeCustomerService: StripeCustomerServiceInterface;
  private stripeIdempotenceService: StripeIdempotenceServiceInterface;
  private subscriptionService: SubscriptionServiceInterface;
  private stripeTaxService: StripeTaxServiceInterface;
  private subscriptionItemService: SubscriptionItemServiceInterface;
  private restaurantPackageService: RestaurantPackageServiceInterface;

  constructor(
    managerPackageService: ManagerPackageServiceInterface,
    managerService: ManagersServiceInterface,
    stripeCustomerService: StripeCustomerServiceInterface,
    stripeIdempotenceService: StripeIdempotenceServiceInterface,
    subscriptionService: SubscriptionServiceInterface,
    stripeTaxService: StripeTaxServiceInterface,
    subscriptionItemService: SubscriptionItemServiceInterface,
    restaurantPackageService: RestaurantPackageServiceInterface,
  ) {
    this.managerPackageService = managerPackageService;
    this.managerService = managerService;
    this.stripeCustomerService = stripeCustomerService;
    this.stripeIdempotenceService = stripeIdempotenceService;
    this.subscriptionService = subscriptionService;
    this.stripeTaxService = stripeTaxService;
    this.subscriptionItemService = subscriptionItemService;
    this.restaurantPackageService = restaurantPackageService;
  }

  createStripeCheckoutSession = async (
    session: CreateStripeCheckoutSessionRequestInterface,
    managerID: number = null,
    stripeCustomerID: string = null,
  ): Promise<string> => {
    try {
      const taxCodes = (await this.stripeTaxService.getStripeTaxCodes()) || [];

      return await this.buildSessionCheckoutDataObject(managerID, session, stripeCustomerID, taxCodes);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while create stripe checkout session for managerID: ${managerID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating stripe checkout session for managerID: ${managerID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getStripeCustomerPortal = async (managerID: number, stripeCustomerID: string) => {
    try {
      if (stripeCustomerID == null) {
        logger.error(`Manager: ${managerID} does not have a stripe account.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Manager: ${managerID} does not have a stripe account.`));
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerID,
        return_url: `${STRIPE.TAP_MANAGER_URL}/settings`,
      });

      return session.url;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching stripe customer portal for managerID: ${managerID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching stripe customer portal for managerID: ${managerID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createConnectAccount = async (): Promise<Stripe.Account> => {
    const account = await stripe.accounts.create({
      type: 'standard',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account;
  };

  createConnectOnboardingLink = async (accountId: string): Promise<Stripe.AccountLink> => {
    const baseUrl = STRIPE.STRIPE_CONNECT_BASE_URL || STRIPE.TAP_MANAGER_URL || '';
    if (!baseUrl || !baseUrl.startsWith('http')) {
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          'Stripe Connect base URL is not configured. Set STRIPE_CONNECT_BASE_URL or TAP_MANAGER_URL to a valid URL (e.g. https://...).',
        ),
      );
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/stripe-connect/onboarding-refresh`,
      return_url: `${baseUrl}/stripe-connect/onboarding-success`,
      type: 'account_onboarding',
    });
    return link;
  };

  retrieveConnectAccount = async (accountId: string): Promise<Stripe.Account> => {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  };

  getStripeCheckoutSession = async (sessionID: string): Promise<GetStripeCheckoutSessionResponse> => {
    try {
      const getSession = await stripe.checkout.sessions.retrieve(sessionID, {
        expand: ['line_items'],
      });

      if (!getSession) {
        logger.error(`Could not get session on Stripe, sessionID: ${sessionID}`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.stripeException, `Could not get session on Stripe, sessionID: ${sessionID}`));
      }

      const { customer: stripeCustomerID, customer_details, payment_status, status, subscription: subscriptionID } = getSession || {};
      const paymentStatus = payment_status === 'paid';
      const checkoutStatus = status === 'complete';
      if (!paymentStatus || !checkoutStatus) {
        logger.error(`payment_status is not paid, or checkout status is not complete, for session: ${sessionID}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.stripeException,
            `payment_status is not paid, or checkout status is not complete, for session: ${sessionID}`,
          ),
        );
      }

      const subscriptionItems = await stripe.subscriptionItems.list({
        subscription: typeof subscriptionID === 'string' ? subscriptionID : (subscriptionID.id as string),
      });

      const { data: stripeSubscriptionItems } = subscriptionItems || {};
      const { email } = customer_details || {};

      // stripeCustomerID, subscriptionID, and stripeSubscriptionItems can not be null / undefined / or empty
      if (!stripeCustomerID || !subscriptionID || !stripeSubscriptionItems.length) {
        logger.error(
          `stripeCustomerID ${stripeCustomerID}, subscriptionID ${subscriptionID}, or stripeSubscriptionItems ${JSON.stringify(
            stripeSubscriptionItems,
          )} is null for session: ${sessionID}`,
        );
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            `stripeCustomerID ${stripeCustomerID}, subscriptionID ${subscriptionID}, or stripeSubscriptionItems ${JSON.stringify(
              stripeSubscriptionItems,
            )} is null for session: ${sessionID}`,
          ),
        );
      }

      // perform check on customer's subscriptions in database.
      const existingSubscriptionsAndSubscriptionItems = await this.subscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(
        typeof subscriptionID === 'string' ? subscriptionID : (subscriptionID.id as string),
      );

      const itemPackageIDs: number[] = this.checkExistingSubscriptionAndItems(existingSubscriptionsAndSubscriptionItems);

      // get manager packages
      const managerPackageIDs: number[] = [];
      let customerEmail: string = email;
      if (itemPackageIDs.length > 0) {
        const managerEntity = await this.managerService.getManagerByStripeCustomerIDOrEmail(stripeCustomerID as string, email);
        if (managerEntity) {
          const managerPackageEntites = await this.managerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs(
            managerEntity.id,
            itemPackageIDs,
          );
          managerPackageEntites?.forEach(managerPackage => {
            managerPackageIDs.push(managerPackage.manager_package_id);
          });
          customerEmail = managerEntity.email;
        }
      }

      return {
        email: customerEmail,
        stripeCustomerID: stripeCustomerID as string,
        managerPackageIDs: managerPackageIDs,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting stripe checkout sessionID: ${sessionID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting stripe checkout sessionID: ${sessionID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  handleStripeEvent = async (event: Stripe.Event) => {
    try {
      if (await this.stripeIdempotenceService.checkStripeEventExists(event.id)) {
        return;
      }

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleStripeCheckoutCompletion(event);
          break;
        case 'customer.updated':
          await this.handleStripeCustomerUpdate(event);
          break;
        case 'customer.subscription.updated':
          await this.handleStripeCustomerSubscriptionUpdated(event);
          break;
        case 'customer.subscription.deleted':
          await this.handleStripeCustomerSubscriptionDeleted(event);
          break;
        case 'invoice.paid':
          await this.handleStripeCustomerSubscriptionPaid(event);
          break;
        default:
          logger.warn(`Unexpected event type: ${event.type}.`);
      }
      await this.stripeIdempotenceService.logStripeEvent(event.id);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling stripe event. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while handling stripe event. Refer to logs for more detail.`),
        );
      }
    }
  };

  handleStripeCheckoutCompletion = async (event: Stripe.Event) => {
    try {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const {
        id: checkoutSessionID,
        customer,
        customer_details,
        success_url: successUrl,
        subscription: subscriptionID,
        payment_status: paymentStatus,
      } = checkoutSession;

      const items = await stripe.checkout.sessions.listLineItems(checkoutSession.id);
      const isPaid = paymentStatus === 'paid';
      const stripeCustomerID = typeof customer === 'string' ? customer : customer.id;
      const email = customer_details?.email;
      const manager: ManagerEntity = await this.managerService.getManagerByStripeCustomerIDOrEmail(stripeCustomerID, email);

      const isExistingUser = !!(manager && Object.keys(manager).length > 0);
      const ormConn: EntityManager = await ormConnection();

      const subscriptionItems = await stripe.subscriptionItems.list({
        subscription: typeof subscriptionID === 'string' ? subscriptionID : (subscriptionID.id as string),
      });

      const newLineItems = this.updateLineItemIDsToSubscriptionItemIDs(items?.data, subscriptionItems?.data);

      await ormConn.transaction(async conn => {
        let managerID: number;
        if (isExistingUser) {
          managerID = manager.id;
          if (!manager.stripe_customer_id) {
            await this.stripeCustomerService.createStripeCustomer(stripeCustomerID, conn);
            await this.managerService.updateManagerEntity({ ...manager, stripe_customer_id: stripeCustomerID }, conn);
          }
        } else {
          await this.stripeCustomerService.createStripeCustomer(stripeCustomerID, conn);
          const createdManager = await this.managerService.createManagerEntity({ email, stripe_customer_id: stripeCustomerID }, conn);
          managerID = createdManager.id;
        }

        const subscription: SubscriptionEntity = await this.subscriptionService.createSubscription(
          typeof subscriptionID === 'string' ? subscriptionID : subscriptionID.id,
          newLineItems,
          stripeCustomerID,
          isPaid,
          conn,
        );

        if (isPaid) {
          const managerPackages: ManagerPackageEntity[] = subscription?.subscription_items?.map(item => ({
            external_user_id: managerID,
            package_id: item.package_id,
          }));
          if (managerPackages.length > 0) {
            await this.managerPackageService.createManagerPackages(managerPackages, conn);
          }
        }
      });

      await sendCheckoutCompletionEmail(
        customer_details?.name,
        email,
        successUrl.replace('{CHECKOUT_SESSION_ID}', checkoutSessionID),
        isExistingUser,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling stripe checkout completion event: ${event.id}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while handling stripe checkout completion event: ${event.id}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  handleStripeCustomerSubscriptionDeleted = async (event: Stripe.Event) => {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const { items } = subscription || {};

      // check existing subscription and subscription items from stripe match in database
      const existingSubscriptionsAndSubscriptionItems = await this.subscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(
        typeof subscription === 'string' ? subscription : (subscription.id as string),
      );

      this.checkExistingSubscriptionAndItems(existingSubscriptionsAndSubscriptionItems);

      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        const subscriptionItems = await this.subscriptionItemService.cancelSubscriptionItems(
          items.data.map(item => item.id),
          conn,
        );
        for (const item of subscriptionItems) {
          if (item?.restaurant_package_id) {
            await this.restaurantPackageService.deactivateRestaurantPackage(item?.restaurant_package_id, conn);
          }
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling stripe customer subscription deleted event: ${event.id}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while handling stripe customer subscription deleted event: ${event.id}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  handleStripeCustomerSubscriptionPaid = async (event: Stripe.Event) => {
    try {
      const invoice = event.data.object as Stripe.Invoice;
      const { lines, subscription } = invoice || {};
      const subscriptionItems = [lines];

      const stripeSubscriptionItemsData: Stripe.InvoiceLineItem[] = [];
      subscriptionItems.forEach(line =>
        line.data.forEach(item => {
          stripeSubscriptionItemsData.push(item);
        }),
      );

      // check existing subscription and subscription items from stripe match in database
      const existingSubscriptionsAndSubscriptionItems = await this.subscriptionService.getSubscriptionsAndSubscriptionItemsByStripeSubscriptionID(
        typeof subscription === 'string' ? subscription : (subscription.id as string),
      );

      this.checkExistingSubscriptionAndItems(existingSubscriptionsAndSubscriptionItems);

      await this.subscriptionItemService.setExpirationDateSubscriptionItems(stripeSubscriptionItemsData);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling stripe customer subscription paid event: ${event.id}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while handling stripe customer subscription paid event: ${event.id}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  handleStripeCustomerSubscriptionUpdated = async (event: Stripe.Event) => {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const { status } = subscription || {};
      if (status === 'unpaid') {
        await this.handleStripeCustomerSubscriptionDeleted(event);
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling stripe customer subscription update event: ${event.id}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while handling stripe customer subscription update event: ${event.id}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  handleStripeCustomerUpdate = async (event: Stripe.Event) => {
    try {
      const customer = event.data.object as Stripe.Customer;
      const { id: stripeCustomerID, email, phone } = customer;

      const manager: ManagerEntity = await this.managerService.getManagerByStripeCustomerIDOrEmail(stripeCustomerID, email);
      if (manager && Object.keys(manager).length > 0) {
        await this.managerService.updateManagerEntity({ ...manager, stripe_customer_id: stripeCustomerID, email, phone });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling stripe customer update event: ${event.id}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while handling stripe customer update event: ${event.id}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  buildSessionCheckoutDataObject = async (
    managerID: number,
    session: CreateStripeCheckoutSessionRequestInterface,
    stripeCustomerID: string,
    taxCodes: StripeTaxEntity[],
  ): Promise<string> => {
    const { packages } = session || {};

    const line_items = [];
    packages.forEach(singlePackage => {
      const singleItem = {};
      singleItem['dynamic_tax_rates'] = taxCodes.map(code => code.stripe_tax_rate_id);
      singleItem['price'] = singlePackage['priceID'];
      singleItem['quantity'] = singlePackage['quantity'];
      line_items.push(singleItem);
    });

    const success_url = managerID
      ? `${STRIPE.TAP_MANAGER_URL}/create-restaurant?session={CHECKOUT_SESSION_ID}`
      : `${STRIPE.TAP_MANAGER_URL}/signup?session={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${STRIPE.TAP_MANAGER_URL}/settings`;

    let sessionID: string;
    if (Object.keys(line_items).length > 0) {
      try {
        if (stripeCustomerID) {
          const sessionData = await stripe.checkout.sessions.create({
            success_url: success_url,
            cancel_url: cancel_url,
            line_items: line_items,
            mode: 'subscription',
            customer: stripeCustomerID,
            payment_method_types: ['card'],
          });
          sessionID = sessionData.id;
        } else {
          const sessionData = await stripe.checkout.sessions.create({
            success_url: success_url,
            cancel_url: cancel_url,
            line_items: line_items,
            mode: 'subscription',
            payment_method_types: ['card'],
          });
          sessionID = sessionData.id;
        }
      } catch (stripeError) {
        logger.error(`Error occurred with Stripe API while attempting to create checkout session for user: ${managerID}. - ${stripeError}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.stripeException,
            `Error occurred with Stripe API while attempting to create checkout session for user: ${managerID}. Refer to logs for more detail.`,
          ),
        );
      }
    }

    return sessionID;
  };

  checkExistingSubscriptionAndItems = (existingSubscriptionsAndSubscriptionItems: SubscriptionEntity[]): number[] => {
    const availableSubscriptionItemsPackageIDs: number[] = [];
    let itemPackageIDs: number[] = [];
    const existingSubscriptionItemIDs: string[] = [];
    existingSubscriptionsAndSubscriptionItems?.forEach(subscription =>
      subscription?.['subscription_items']?.forEach(subscriptionItem => {
        // get existing stripe_subscription_item_ids
        existingSubscriptionItemIDs.push(subscriptionItem?.stripe_subscription_item_id);

        // also get only subscription_items where restaurant_package_id = null and assigned_at = false for later...
        if (!subscriptionItem?.assigned_at && !subscriptionItem?.restaurant_package_id) {
          availableSubscriptionItemsPackageIDs.push(subscriptionItem?.package_id);
        }
      }),
    );
    const itemPackageIDsSet = new Set(availableSubscriptionItemsPackageIDs);
    itemPackageIDs = [...itemPackageIDsSet];

    return itemPackageIDs;
  };

  // using stripe line items as they provide tax amounts that we record in our database
  // changing the stripe line items ids to have stripe subscription item ids as these ids are needed for monitoring incoming subscription items in webhooks
  updateLineItemIDsToSubscriptionItemIDs = (items: Stripe.LineItem[], subscriptionItems: Stripe.SubscriptionItem[]): Stripe.LineItem[] => {
    const newLineItems: Stripe.LineItem[] = [];
    const setCheck = new Set();
    for (const item of items) {
      for (const subscriptionItem of subscriptionItems) {
        if (item?.price?.id === subscriptionItem?.price.id && !setCheck.has(subscriptionItem.id)) {
          newLineItems.push({ ...item, id: subscriptionItem.id });
          setCheck.add(subscriptionItem.id);
          break;
        }
      }
    }

    if (newLineItems.length !== subscriptionItems.length) {
      logger.error(
        `stripe line items: ${JSON.stringify(items)} do not match with stripe subscription items: ${JSON.stringify(subscriptionItems)} based on ids`,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `stripe line items: ${JSON.stringify(items)} do not match with stripe subscription items: ${JSON.stringify(
            subscriptionItems,
          )} based on ids`,
        ),
      );
    }

    return newLineItems;
  };
}

export default StripeService;
