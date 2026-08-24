import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { DiscoveryContentControllerInterface } from '@interfaces/discoveryContent.interface';
import { CreateDiscoveryContentDto, DeleteDiscoveryContentDto, EditDiscoveryContentDto, HideDiscoveryContentDto } from '@dtos/discoveryContent.dto';
import { checkDiscoveryContentAndRestaurantIDMiddleware } from '@middlewares/checkDiscoveryContentAndRestaurantID.middleware';
import checkMultipleMediaIDLinkedToRestaurantIDMiddleware from '@/middlewares/checkMultipleMediaIDsAndRestaurantID.middleware';

class DiscoveryContentRoute implements Route {
  public path = '/discoveryContent';
  public router = Router();

  private discoveryContentController: DiscoveryContentControllerInterface;

  constructor(discoveryContentController: DiscoveryContentControllerInterface) {
    this.discoveryContentController = discoveryContentController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.delete(
      '/:discoveryContentID',
      validationMiddleware(DeleteDiscoveryContentDto, 'params'),
      checkDiscoveryContentAndRestaurantIDMiddleware,
      this.discoveryContentController.deleteDiscoveryContent,
    );
    this.router.put(
      '/hide',
      validationMiddleware(HideDiscoveryContentDto, 'body'),
      checkDiscoveryContentAndRestaurantIDMiddleware,
      this.discoveryContentController.hideDiscoveryContent,
    );
    this.router.post(
      '/',
      validationMiddleware(CreateDiscoveryContentDto, 'body'),
      checkMultipleMediaIDLinkedToRestaurantIDMiddleware,
      this.discoveryContentController.createDiscoveryContent,
    );
    this.router.get('/', this.discoveryContentController.getDiscoveryContent);
    this.router.put(
      '/',
      validationMiddleware(EditDiscoveryContentDto, 'body'),
      checkDiscoveryContentAndRestaurantIDMiddleware,
      checkMultipleMediaIDLinkedToRestaurantIDMiddleware,
      this.discoveryContentController.editDiscoveryContent,
    );
  }
}

export default DiscoveryContentRoute;
