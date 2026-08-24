import {
  MenuLayoutControllerInterface,
  MenuLayoutServiceInterface,
  UpdateRestaurantMenuLayoutRequestInterface,
} from '@/interfaces/menuLayout.interface';
import { Response, Request, NextFunction } from 'express-serve-static-core';

class MenuLayoutsController implements MenuLayoutControllerInterface {
  private menuLayoutService: MenuLayoutServiceInterface;

  constructor(menuLayoutService: MenuLayoutServiceInterface) {
    this.menuLayoutService = menuLayoutService;
  }

  getAllMenuLayouts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.menuLayoutService.getAllMenuLayouts();
      res.json({ layouts: result });
    } catch (err) {
      next(err);
    }
  };

  updateRestaurantMenuLayout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = res.locals.restaurantID;
      const { layoutID } = req.body as UpdateRestaurantMenuLayoutRequestInterface;
      await this.menuLayoutService.updateRestaurantMenuLayout(layoutID, restaurantID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default MenuLayoutsController;
