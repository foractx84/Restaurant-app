import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import bodyParser from 'body-parser';
import authorizationMiddleware from '@middlewares/authorization.middleware';
import { OtterIntegrationControllerInterface } from '@interfaces/otterIntegration.interface';

class OtterIntegrationRoute implements Route {
  public path = '/otter';
  public router: Router = Router();

  constructor(private readonly otterIntegrationController: OtterIntegrationControllerInterface) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/auth/authorize', authorizationMiddleware, this.otterIntegrationController.authorize);
    this.router.get('/auth/callback', this.otterIntegrationController.oAuthCallback);
    this.router.post('/webhook', bodyParser.raw({ type: 'application/json' }), this.otterIntegrationController.initWebhook);
    this.router.post('/menu-sync', authorizationMiddleware, this.otterIntegrationController.triggerMenuSync);
    this.router.post('/menu-push', authorizationMiddleware, this.otterIntegrationController.pushMenu);

    // Storefront pause/unpause — backs the TapManager toggle Otter requires for certification.
    this.router.get('/storefront/status', authorizationMiddleware, this.otterIntegrationController.getStorefrontStatus);
    this.router.post('/storefront/pause', authorizationMiddleware, this.otterIntegrationController.pauseStorefront);
    this.router.post('/storefront/unpause', authorizationMiddleware, this.otterIntegrationController.unpauseStorefront);
  }
}

export default OtterIntegrationRoute;
