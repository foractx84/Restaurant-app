import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';

export interface StripeControllerInterface {
  createStripeCheckoutSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getStripeCheckoutSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getStripeCustomerPortal: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  initWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface StripeServiceInterface {
  createStripeCheckoutSession: (
    stripeCheckoutData: CreateStripeCheckoutSessionRequestInterface,
    managerID?: number,
    stripeCustomerID?: string,
  ) => Promise<string>;
  getStripeCheckoutSession: (sessionID: string) => Promise<GetStripeCheckoutSessionResponse>;
  getStripeCustomerPortal: (managerID: number, stripeCustomerID: string) => Promise<string>;
  createConnectAccount: () => Promise<Stripe.Account>;
  createConnectOnboardingLink: (accountId: string) => Promise<Stripe.AccountLink>;
  retrieveConnectAccount: (accountId: string) => Promise<Stripe.Account>;
  handleStripeEvent: (event: Stripe.Event) => Promise<void>;
  handleStripeCheckoutCompletion: (event: Stripe.Event) => Promise<void>;
  handleStripeCustomerUpdate: (event: Stripe.Event) => Promise<void>;
}

export class StripeCheckoutSessionRequestPackagesInterface {
  priceID: string;
  quantity: number;
}

export interface CreateStripeCheckoutSessionRequestInterface {
  packages: StripeCheckoutSessionRequestPackagesInterface[];
}

export interface GetStripeCheckoutSessionRequest {
  session: string;
}

export interface GetStripeCheckoutSessionResponse {
  stripeCustomerID: string;
  managerPackageIDs: number[];
  email: string;
}
