import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { CreateDrinkItemsDto, EditDrinkItemDto, HideDrinkItemsDto } from '@dtos/drinkItems.dto';
import { MenuItemControllerInterface } from '@interfaces/menuItem.interface';
import menuSectionLinkedToRestaurantMiddleware from '@middlewares/checkMenuSectionIDAndRestaurantID.middleware';
import { checkMenuItemIDAndRestaurantIDMiddleware } from '@/middlewares/checkMenuItemIDAndRestaurantID.middleware';
import { DeleteDrinkItemDto } from '@dtos/drinkItems.dto';
import { DrinkItemControllerInterface } from '@interfaces/drinkItem.interface';

class DrinkItemRoute implements Route {
  public path = '/drinkItem';
  public router = Router();

  private drinkItemController: DrinkItemControllerInterface;
  private menuItemController: MenuItemControllerInterface;

  constructor(drinkItemController: DrinkItemControllerInterface, menuItemController: MenuItemControllerInterface) {
    this.drinkItemController = drinkItemController;
    this.menuItemController = menuItemController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      validationMiddleware(CreateDrinkItemsDto, `body`),
      menuSectionLinkedToRestaurantMiddleware,
      this.menuItemController.createMenuItem,
    );
    this.router.delete(
      '/:menuItemID',
      validationMiddleware(DeleteDrinkItemDto, `params`),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.deleteMenuItem,
    );
    this.router.put(
      '/',
      validationMiddleware(EditDrinkItemDto, `body`),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.editMenuItem,
    );
    this.router.put(
      '/hide',
      validationMiddleware(HideDrinkItemsDto, `body`),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.hideMenuItem,
    );
  }
}

export default DrinkItemRoute;
