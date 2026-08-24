import {
  MenuSectionsControllerInterface,
  CreateMenuSectionsRequestInterface,
  MenuSectionsServiceInterface,
  EditMenuSectionRequestInterface,
  ReorderMenuSectionsRequestInterface,
  HideMenuSectionRequestInterface,
} from '@/interfaces/menuSections.interface';
import { SoftDeleteServiceInterface } from '@/interfaces/softDelete.interface';
import { Response, Request, NextFunction } from 'express-serve-static-core';

class MenuSectionsController implements MenuSectionsControllerInterface {
  private menuSectionsService: MenuSectionsServiceInterface;
  private softDeleteService: SoftDeleteServiceInterface;

  constructor(menuSectionsService: MenuSectionsServiceInterface, softDeleteService: SoftDeleteServiceInterface) {
    this.menuSectionsService = menuSectionsService;
    this.softDeleteService = softDeleteService;
  }

  editMenuSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuSectionData = req.body as EditMenuSectionRequestInterface;
      const { menuID, menuSectionID, menuSectionName, message } = menuSectionData || {};

      await this.menuSectionsService.editMenuSection(menuID, menuSectionID, menuSectionName, message);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  createMenuSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuData = req.body as CreateMenuSectionsRequestInterface;
      const { menuID, menuSections } = menuData;

      const result = await this.menuSectionsService.createMenuSections(menuSections, menuID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteMenuSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuSectionID: number = parseInt(req.params.menuSectionID);
      await this.softDeleteService.softDeleteMenuSectionByID(menuSectionID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  hideMenuSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { menuSectionID, hide } = req.body as HideMenuSectionRequestInterface;
      await this.menuSectionsService.hideMenuSection(menuSectionID, hide);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  reorderMenuSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menuData = req.body as ReorderMenuSectionsRequestInterface;
      const { menuID, menuSectionsOrder } = menuData;
      await this.menuSectionsService.reorderMenuSections(menuID, menuSectionsOrder);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default MenuSectionsController;
