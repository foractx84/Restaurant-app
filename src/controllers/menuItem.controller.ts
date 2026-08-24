import { NextFunction, Request, Response } from 'express-serve-static-core';
import {
  CreateMenuItemRequestInterface,
  CreateMenuItemRestrictionsRequestInterface,
  EditMenuItemRequestInterface,
  MenuItemControllerInterface,
  MenuItemServiceInterface,
  ReorderMenuItemsRequestInterface,
  HideMenuItemRequestInterface,
  TagMenuItemsRequestInterface,
  PairMenuItemRequestInterface,
  UploadMultipleMenuItemMediaRequestInterface,
  LinkMenuItemAndModifierGroupsRequestInterface,
} from '@interfaces/menuItem.interface';
import { deleteMediaIfExists } from '@utils/imageUtils';
import { validateArrayOfIDs, validateImageOrderArray } from '@utils/util';
import { LinkMenuItemAndMediaDto } from '@dtos/menuItem.dto';
import { MediaEntity } from '@entities/media.entity';

class MenuItemController implements MenuItemControllerInterface {
  private menuItemService: MenuItemServiceInterface;

  constructor(menuItemService: MenuItemServiceInterface) {
    this.menuItemService = menuItemService;
  }

  createMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuItemRequest = req.body as CreateMenuItemRequestInterface;
      const result = await this.menuItemService.createMenuItem(menuItemRequest);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuItemID: number = parseInt(req.params.menuItemID);
      await this.menuItemService.softDeleteMenuItemByID(menuItemID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuItemRequest = req.body as EditMenuItemRequestInterface;
      await this.menuItemService.editMenuItem(menuItemRequest);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  hideMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuItemData = req.body as HideMenuItemRequestInterface;
      const { menuItemID, hide } = menuItemData;
      await this.menuItemService.hideMenuItem(menuItemID, hide);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkDrinkItemsToMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { menuItemID, pairingItemIDs } = req.body as PairMenuItemRequestInterface;
      const restaurantID: number = parseInt(res.locals.restaurantID);
      await this.menuItemService.linkDrinkItemsToMenuItem(menuItemID, pairingItemIDs, restaurantID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkMediaToMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const media = res.locals.media as MediaEntity[];
      const requestBody = req.body as LinkMenuItemAndMediaDto;
      await this.menuItemService.linkMediaToMenuItem(media, requestBody);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkModifierGroupsToMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuItemRequest = req.body as LinkMenuItemAndModifierGroupsRequestInterface;
      const restaurantID: number = parseInt(res.locals.restaurantID);
      await this.menuItemService.linkModifierGroupsToMenuItem(menuItemRequest.menuItemID, menuItemRequest.modifierGroupIDs, restaurantID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkRestrictionsToMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuItemRequest = req.body as CreateMenuItemRestrictionsRequestInterface;
      await this.menuItemService.linkRestrictionsToMenuItem(menuItemRequest.menuItemID, menuItemRequest.dietaryRestrictionIDs);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkTagToMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { menuItemID, tagIDs } = req.body as TagMenuItemsRequestInterface;
      const restaurantID: number = parseInt(res.locals.restaurantID);
      await this.menuItemService.linkTagToMenuItem(menuItemID, tagIDs, restaurantID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  reorderMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuData = req.body as ReorderMenuItemsRequestInterface;
      const { menuSectionID, menuItemsOrder } = menuData;
      await this.menuItemService.reorderMenuItems(menuSectionID, menuItemsOrder);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  uploadMenuItemMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { body, files } = req;
    const images: string[] = files?.['images']?.map(image => image?.filename) ?? [];
    const thumbnail: string = files?.['thumbnail']?.map(image => image?.filename)[0] ?? '';
    const video: string = files?.['video']?.map(image => image?.filename)[0] ?? '';

    try {
      const { menuItemID, mediaOrder, mediaToRemove } = body as UploadMultipleMenuItemMediaRequestInterface;

      const idsToDelete = !!mediaToRemove ? JSON.parse(mediaToRemove) : [];
      validateArrayOfIDs(idsToDelete);

      const order = !!mediaOrder ? JSON.parse(mediaOrder) : [];
      validateImageOrderArray(order);

      const result = await this.menuItemService.uploadMenuItemMedia(images, menuItemID, order, idsToDelete, thumbnail, video);
      if (result != null) {
        res.json(result);
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      if (images?.length || thumbnail || video) {
        const imagesAndThumbnails = thumbnail ? [...images, thumbnail] : [...images]; // avoid empty string default in array upload -> [ '' ]
        await deleteMediaIfExists(imagesAndThumbnails, video);
      }
      next(err);
    }
  };
}

export default MenuItemController;
