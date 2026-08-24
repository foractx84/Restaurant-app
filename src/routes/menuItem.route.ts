import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import {
  CreateMenuItemDietaryRestrictions,
  CreateMenuItemDto,
  DeleteMenuItemDto,
  EditMenuItemDto,
  HideMenuItemsDto,
  LinkMenuItemAndModifierGroups,
  PairMenuItemsDto,
  ReorderMenuItemsDto,
  TagMenuItemsDto,
} from '@dtos/menuItem.dto';
import { MenuItemControllerInterface } from '@interfaces/menuItem.interface';
import { uploadImageMiddleware } from '@middlewares/uploadImage.middleware';
import { imageUpload } from '@utils/imageUtils';
import { reformatImageMiddleware } from '@middlewares/reformatImage.middleware';
import { checkMenuItemIDAndRestaurantIDMiddleware } from '@middlewares/checkMenuItemIDAndRestaurantID.middleware';
import menuSectionLinkedToRestaurantMiddleware from '@middlewares/checkMenuSectionIDAndRestaurantID.middleware';
import { checkMenuItemIsFoodMiddleware } from '@middlewares/checkMenuItemIsFood.middleware';
import { MENU_ITEM_MEDIA } from '@/configs/config';

class MenuItemRoute implements Route {
  public path = '/menuItem';
  public router = Router();

  private menuItemController: MenuItemControllerInterface;

  constructor(menuItemController: MenuItemControllerInterface) {
    this.menuItemController = menuItemController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      validationMiddleware(CreateMenuItemDto, 'body'),
      menuSectionLinkedToRestaurantMiddleware,
      this.menuItemController.createMenuItem,
    );
    this.router.put(
      '/',
      validationMiddleware(EditMenuItemDto, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      menuSectionLinkedToRestaurantMiddleware,
      this.menuItemController.editMenuItem,
    );
    this.router.delete(
      '/:menuItemID',
      validationMiddleware(DeleteMenuItemDto, 'params'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.deleteMenuItem,
    );
    this.router.post(
      '/media',
      uploadImageMiddleware(
        imageUpload.fields([
          { name: `images`, maxCount: MENU_ITEM_MEDIA.MAX_MENU_ITEM_IMAGES_VALUE },
          { name: 'video', maxCount: MENU_ITEM_MEDIA.MAX_MENU_ITEM_VIDEOS_VALUE },
          { name: 'thumbnail', maxCount: MENU_ITEM_MEDIA.MAX_MENU_ITEM_THUMBNAILS_VALUE },
        ]),
      ),
      reformatImageMiddleware,
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.uploadMenuItemMedia,
    );
    this.router.put(
      '/hide',
      validationMiddleware(HideMenuItemsDto, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.hideMenuItem,
    );
    this.router.put(
      '/pair',
      validationMiddleware(PairMenuItemsDto, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      checkMenuItemIsFoodMiddleware,
      this.menuItemController.linkDrinkItemsToMenuItem,
    );
    this.router.put(
      '/restrictions',
      validationMiddleware(CreateMenuItemDietaryRestrictions, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.linkRestrictionsToMenuItem,
    );
    this.router.patch(
      '/reorder',
      validationMiddleware(ReorderMenuItemsDto, 'body'),
      menuSectionLinkedToRestaurantMiddleware,
      this.menuItemController.reorderMenuItems,
    );
    this.router.put(
      '/modifierGroups',
      validationMiddleware(LinkMenuItemAndModifierGroups, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.linkModifierGroupsToMenuItem,
    );
    this.router.put(
      '/tag',
      validationMiddleware(TagMenuItemsDto, 'body'),
      checkMenuItemIDAndRestaurantIDMiddleware,
      this.menuItemController.linkTagToMenuItem,
    );
  }
}

export default MenuItemRoute;
