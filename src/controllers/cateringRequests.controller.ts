import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CateringRequestStatus, CateringRequestsControllerInterface, CateringRequestsServiceInterface } from '@interfaces/cateringRequests.interface';

class CateringRequestsController implements CateringRequestsControllerInterface {
  private cateringRequestsService: CateringRequestsServiceInterface;

  constructor(cateringRequestsService: CateringRequestsServiceInterface) {
    this.cateringRequestsService = cateringRequestsService;
  }

  listCateringRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const status = (req.query.status as CateringRequestStatus) || undefined;
      res.json(await this.cateringRequestsService.listCateringRequests(restaurantID, { status }));
    } catch (err) {
      next(err);
    }
  };

  getCateringRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const cateringRequestID = parseInt(req.params.cateringRequestID);
      res.json(await this.cateringRequestsService.getCateringRequest(cateringRequestID, restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updateCateringRequestStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const cateringRequestID = parseInt(req.params.cateringRequestID);
      res.json(await this.cateringRequestsService.updateCateringRequestStatus(cateringRequestID, restaurantID, req.body.status));
    } catch (err) {
      next(err);
    }
  };

  deleteCateringRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const cateringRequestID = parseInt(req.params.cateringRequestID);
      await this.cateringRequestsService.deleteCateringRequest(cateringRequestID, restaurantID);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

export default CateringRequestsController;
