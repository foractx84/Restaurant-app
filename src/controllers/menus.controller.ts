import {
  MenusControllerInterface,
  CreateMenusRequestInterface,
  MenusServiceInterface,
  EditMenuRequestInterface,
  ReorderMenusRequestInterface,
  HideMenuRequestInterface,
} from '@/interfaces/menus.interface';
import { Response, Request, NextFunction } from 'express-serve-static-core';
import { SoftDeleteServiceInterface } from '@/interfaces/softDelete.interface';
import { FileGenerationType } from '@/enums/fileGenerationType';
import { GenerateMenuFileDto } from '@/dtos/menus.dto';

class MenusController implements MenusControllerInterface {
  private menusService: MenusServiceInterface;
  private softDeleteService: SoftDeleteServiceInterface;

  constructor(menusService: MenusServiceInterface, softDeleteService: SoftDeleteServiceInterface) {
    this.menusService = menusService;
    this.softDeleteService = softDeleteService;
  }

  createMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = res.locals.restaurantID;
      const menuData = req.body as CreateMenusRequestInterface;
      const result = await this.menusService.createMenus(menuData, restaurantID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuID: number = parseInt(req.params.menuID);
      await this.softDeleteService.softDeleteMenuByID(menuID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuData = req.body as EditMenuRequestInterface;
      const result = await this.menusService.editMenu(menuData);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getMenuDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuID = parseInt(req.params.menuID);
      const result = await this.menusService.getMenuDetails(menuID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  generateFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileFormat, menuID } = req.body as GenerateMenuFileDto;
      res.json(await this.menusService.generateFile(fileFormat || FileGenerationType.PDF, menuID));
    } catch (err) {
      next(err);
    }
  };

  hideMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { menuID, hide } = req.body as HideMenuRequestInterface;
      await this.menusService.hideMenu(menuID, hide);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  reorderMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuData = req.body as ReorderMenusRequestInterface;
      const { menusOrder } = menuData;
      const restaurantID = parseInt(res.locals.restaurantID);
      await this.menusService.reorderMenus(restaurantID, menusOrder);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default MenusController;
