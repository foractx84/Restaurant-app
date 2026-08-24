import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import menuLinkedToRestaurantMiddleware from '@/middlewares/checkMenuIDAndRestaurantID.middeware';
import { MenuSectionsControllerInterface } from '@/interfaces/menuSections.interface';
import {
  CreateMenuSectionsDto,
  DeleteMenuSectionsDto,
  EditMenuSectionDto,
  HideMenuSectionDto,
  ReorderMenuSectionsDto,
} from '@/dtos/menuSections.dto';
import menuSectionLinkedToRestaurantMiddleware from '@/middlewares/checkMenuSectionIDAndRestaurantID.middleware';

class MenusRoute implements Route {
  public path = '/menuSections';
  public router = Router();
  private menuSectionsController: MenuSectionsControllerInterface;

  constructor(menuSectionsController: MenuSectionsControllerInterface) {
    this.menuSectionsController = menuSectionsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      validationMiddleware(CreateMenuSectionsDto, 'body'),
      menuLinkedToRestaurantMiddleware,
      this.menuSectionsController.createMenuSections,
    );
    this.router.put(
      '/',
      validationMiddleware(EditMenuSectionDto, 'body'),
      menuLinkedToRestaurantMiddleware,
      menuSectionLinkedToRestaurantMiddleware,
      this.menuSectionsController.editMenuSection,
    );
    this.router.delete(
      '/:menuSectionID',
      validationMiddleware(DeleteMenuSectionsDto, 'params'),
      menuSectionLinkedToRestaurantMiddleware,
      this.menuSectionsController.deleteMenuSection,
    );
    this.router.patch(
      '/reorder',
      validationMiddleware(ReorderMenuSectionsDto, 'body'),
      menuLinkedToRestaurantMiddleware,
      this.menuSectionsController.reorderMenuSections,
    );
    this.router.put(
      '/hide',
      validationMiddleware(HideMenuSectionDto, 'body'),
      menuSectionLinkedToRestaurantMiddleware,
      this.menuSectionsController.hideMenuSection,
    );
  }
}

export default MenusRoute;
