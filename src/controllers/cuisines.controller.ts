import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CuisinesControllerInterface, CuisinesServiceInterface } from '@interfaces/cuisines.interface';

class CuisinesController implements CuisinesControllerInterface {
  private cuisinesService: CuisinesServiceInterface;

  constructor(cuisinesService: CuisinesServiceInterface) {
    this.cuisinesService = cuisinesService;
  }

  getAllCuisines = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.cuisinesService.getAllCuisines());
    } catch (err) {
      next(err);
    }
  };
}

export default CuisinesController;
