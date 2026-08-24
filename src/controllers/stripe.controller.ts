import { Request, Response, NextFunction } from 'express-serve-static-core';
import { CreateStripeCheckoutSessionRequestInterface, StripeControllerInterface, StripeServiceInterface } from '@interfaces/stripe.interface';
import { STRIPE } from '@/configs/config';

import Stripe from 'stripe';
const stripe = new Stripe(STRIPE.STRIPE_API_KEY, {
  apiVersion: '2022-08-01',
  typescript: true,
});

const endpointSecret = STRIPE.STRIPE_WEBHOOK_SECRET;

class StripeController implements StripeControllerInterface {
  private stripeService: StripeServiceInterface;

  constructor(stripeService: StripeServiceInterface) {
    this.stripeService = stripeService;
  }

  createStripeCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionData = req.body as CreateStripeCheckoutSessionRequestInterface;
      const managerID = res.locals.managerID ? parseInt(res.locals.managerID) : null;
      const stripeCustomerID = res.locals.stripeCustomerID ? String(res.locals.stripeCustomerID) : null;
      const sessionID = await this.stripeService.createStripeCheckoutSession(sessionData, managerID, stripeCustomerID);
      res.json(sessionID);
    } catch (err) {
      next(err);
    }
  };

  getStripeCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.stripeService.getStripeCheckoutSession(req.query.session.toString()));
    } catch (err) {
      next(err);
    }
  };

  getStripeCustomerPortal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const managerID = res.locals.managerID ? parseInt(res.locals.managerID) : null;
      const stripeCustomerID = res.locals.stripeCustomerID ? String(res.locals.stripeCustomerID) : null;
      const url = await this.stripeService.getStripeCustomerPortal(managerID, stripeCustomerID);
      res.json(url);
    } catch (err) {
      next(err);
    }
  };

  initWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const sig = req.headers['stripe-signature'];

      const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      await this.stripeService.handleStripeEvent(event);
      res.status(200).end();
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`).end();
      return;
    }
  };
}

export default StripeController;
