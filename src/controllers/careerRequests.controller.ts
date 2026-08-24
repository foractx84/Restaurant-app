import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CareerRequestStatus, CareerRequestsControllerInterface, CareerRequestsServiceInterface } from '@interfaces/careerRequests.interface';

class CareerRequestsController implements CareerRequestsControllerInterface {
  private careerRequestsService: CareerRequestsServiceInterface;

  constructor(careerRequestsService: CareerRequestsServiceInterface) {
    this.careerRequestsService = careerRequestsService;
  }

  listCareerRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const status = (req.query.status as CareerRequestStatus) || undefined;
      res.json(await this.careerRequestsService.listCareerRequests(restaurantID, { status }));
    } catch (err) {
      next(err);
    }
  };

  getCareerRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const careerRequestID = parseInt(req.params.careerRequestID);
      res.json(await this.careerRequestsService.getCareerRequest(careerRequestID, restaurantID));
    } catch (err) {
      next(err);
    }
  };

  updateCareerRequestStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const careerRequestID = parseInt(req.params.careerRequestID);
      res.json(await this.careerRequestsService.updateCareerRequestStatus(careerRequestID, restaurantID, req.body.status));
    } catch (err) {
      next(err);
    }
  };

  deleteCareerRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const careerRequestID = parseInt(req.params.careerRequestID);
      await this.careerRequestsService.deleteCareerRequest(careerRequestID, restaurantID);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

export default CareerRequestsController;
