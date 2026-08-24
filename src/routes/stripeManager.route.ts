import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { StripeControllerInterface } from '@interfaces/stripe.interface';
import parseTokenMiddleware from '@/middlewares/parseToken.middleware';
import getManagerStripeCustomerIDByManagerID from '@/middlewares/getManagerStripeCustomerIDByManagerID.middleware';

class StripeManagerRoute implements Route {
  public path = '/manager/portal';
  public router = Router();
  private stripeController: StripeControllerInterface;

  constructor(stripeController: StripeControllerInterface) {
    this.stripeController = stripeController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', parseTokenMiddleware, getManagerStripeCustomerIDByManagerID, this.stripeController.getStripeCustomerPortal);
  }
}

export default StripeManagerRoute;
