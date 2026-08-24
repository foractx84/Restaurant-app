import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { StripeControllerInterface } from '@interfaces/stripe.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import { GetStripeCheckoutSessionDto } from '@/dtos/stripe.dto';

class StripeRoute implements Route {
  public path = '/packages/checkout';
  public router = Router();
  private stripeController: StripeControllerInterface;

  constructor(stripeController: StripeControllerInterface) {
    this.stripeController = stripeController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', validationMiddleware(GetStripeCheckoutSessionDto, 'query'), this.stripeController.getStripeCheckoutSession);
  }
}

export default StripeRoute;
