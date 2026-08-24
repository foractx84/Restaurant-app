import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { CheckmateControllerInterface } from '@interfaces/checkmateIntegration.interface';
import bodyParser from 'body-parser';

class CheckmateIntegrationRoute implements Route {
  public path = '/checkmate';
  public router: Router = Router();

  private checkmateController: CheckmateControllerInterface;

  constructor(checkmateController: CheckmateControllerInterface) {
    this.checkmateController = checkmateController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/auth/callback', this.checkmateController.oAuthCallback);
    this.router.post('/webhook', bodyParser.raw({ type: 'application/json' }), this.checkmateController.initWebhook);
  }
}

export default CheckmateIntegrationRoute;
