import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { MenuLayoutControllerInterface } from '@interfaces/menuLayout.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import { UpdateRestaurantMenuLayoutDto } from '@/dtos/menuLayouts.dto';

class MenuLayoutsRoute implements Route {
  public path = '/menuLayouts';
  public router = Router();

  private menuLayoutController: MenuLayoutControllerInterface;

  constructor(menuLayoutController: MenuLayoutControllerInterface) {
    this.menuLayoutController = menuLayoutController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.patch(
      '/restaurant',
      validationMiddleware(UpdateRestaurantMenuLayoutDto, 'body'),
      this.menuLayoutController.updateRestaurantMenuLayout,
    );
    this.router.get('/', this.menuLayoutController.getAllMenuLayouts);
  }
}

export default MenuLayoutsRoute;
