import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { LinkMenuItemAndMediaDto } from '@dtos/menuItem.dto';
import { MenuItemControllerInterface } from '@interfaces/menuItem.interface';
import { checkMenuItemIDAndRestaurantIDMiddleware } from '@middlewares/checkMenuItemIDAndRestaurantID.middleware';
import checkMultipleMediaIDLinkedToRestaurantIDMiddleware from '@middlewares/checkMultipleMediaIDsAndRestaurantID.middleware';

class MenusItemRoute implements Route {
  public path = '/menuItems';
  public router = Router();

  private menuItemController: MenuItemControllerInterface;

  constructor(menuItemController: MenuItemControllerInterface) {
    this.menuItemController = menuItemController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/media',
      validationMiddleware(LinkMenuItemAndMediaDto, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      checkMultipleMediaIDLinkedToRestaurantIDMiddleware,
      this.menuItemController.linkMediaToMenuItem,
    );
  }
}

export default MenusItemRoute;
