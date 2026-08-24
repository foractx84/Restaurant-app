import { NextFunction, Request, Response } from 'express-serve-static-core';
import DietaryRestrictionsService from '@/services/dietaryRestrictions.service';
import { DietaryRestrictionsControllerInterface } from '@/interfaces/dietaryRestrictions.interface';

class DietaryRestrictionsController implements DietaryRestrictionsControllerInterface {
  private dietaryRestrictionService: DietaryRestrictionsService;

  constructor(restrictionService: DietaryRestrictionsService) {
    this.dietaryRestrictionService = restrictionService;
  }

  getAllRestrictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.dietaryRestrictionService.getAllRestrictions();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export default DietaryRestrictionsController;
