import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { MenusControllerInterface } from '@/interfaces/menus.interface';
import { CreateMenusDto, DeleteMenusDto, GetMenuDto, EditMenusDto, ReorderMenusDto, HideMenuDto, GenerateMenuFileDto } from '@/dtos/menus.dto';
import checkMenuIDAndRestaurantIDMiddleware from '@/middlewares/checkMenuIDAndRestaurantID.middeware';

class MenusRoute implements Route {
  public path = '/menus';
  public router = Router();
  private menusController: MenusControllerInterface;

  constructor(menusController: MenusControllerInterface) {
    this.menusController = menusController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', validationMiddleware(CreateMenusDto, 'body', ...Array(3), true), this.menusController.createMenus);
    this.router.delete(
      '/:menuID',
      validationMiddleware(DeleteMenusDto, 'params'),
      checkMenuIDAndRestaurantIDMiddleware,
      this.menusController.deleteMenu,
    );
    this.router.get(
      '/:menuID',
      validationMiddleware(GetMenuDto, 'params'),
      checkMenuIDAndRestaurantIDMiddleware,
      this.menusController.getMenuDetails,
    );
    this.router.put('/', validationMiddleware(EditMenusDto, 'body'), checkMenuIDAndRestaurantIDMiddleware, this.menusController.editMenu);
    this.router.patch('/reorder', validationMiddleware(ReorderMenusDto, 'body'), this.menusController.reorderMenus);
    this.router.put('/hide', validationMiddleware(HideMenuDto, 'body'), checkMenuIDAndRestaurantIDMiddleware, this.menusController.hideMenu);
    this.router.post(
      '/generateFile',
      validationMiddleware(GenerateMenuFileDto, 'body'),
      checkMenuIDAndRestaurantIDMiddleware,
      this.menusController.generateFile,
    );
  }
}

export default MenusRoute;
