import { NextFunction, Request, Response } from 'express-serve-static-core';
import { PageOrderControllerInterface, PageOrderServiceInterface } from '@interfaces/pageOrder.interface';

class PageOrderController implements PageOrderControllerInterface {
  private pageOrderService: PageOrderServiceInterface;

  constructor(pageOrderService: PageOrderServiceInterface) {
    this.pageOrderService = pageOrderService;
  }

  getPageOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.pageOrderService.getPageOrder(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updatePageOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.pageOrderService.updatePageOrder(restaurantID, req.body));
    } catch (err) {
      next(err);
    }
  };
}

export default PageOrderController;
