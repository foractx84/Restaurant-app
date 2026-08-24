import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { StripeControllerInterface } from '@interfaces/stripe.interface';
import bodyParser from 'body-parser';
import validationMiddleware from '@/middlewares/validation.middleware';
import { CreateStripeCheckoutSessionDto } from '@/dtos/stripe.dto';
import parseTokenMiddleware from '@/middlewares/parseToken.middleware';
import getManagerStripeCustomerIDByManagerID from '@/middlewares/getManagerStripeCustomerIDByManagerID.middleware';

class StripeRoute implements Route {
  public path = '/stripe';
  public router = Router();
  private stripeController: StripeControllerInterface;

  constructor(stripeController: StripeControllerInterface) {
    this.stripeController = stripeController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/checkout',
      parseTokenMiddleware,
      getManagerStripeCustomerIDByManagerID,
      validationMiddleware(CreateStripeCheckoutSessionDto, 'body'),
      this.stripeController.createStripeCheckoutSession,
    );
    this.router.post('/webhook', bodyParser.raw({ type: 'application/json' }), this.stripeController.initWebhook);
  }
}

export default StripeRoute;
