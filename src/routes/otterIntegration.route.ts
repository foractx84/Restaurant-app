import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import bodyParser from 'body-parser';
import authorizationMiddleware from '@middlewares/authorization.middleware';
import { OtterIntegrationControllerInterface } from '@interfaces/otterIntegration.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { UpdateOtterStorefrontAvailabilityDto } from '@dtos/otterIntegration.dto';

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
    this.router.patch(
      '/storefront/availability',
      authorizationMiddleware,
      validationMiddleware(
        UpdateOtterStorefrontAvailabilityDto,
        'body',
      ),
      this.otterIntegrationController.updateStorefrontAvailability,
    );
  }
}

export default OtterIntegrationRoute;
