import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { DietaryRestrictionsControllerInterface } from '@/interfaces/dietaryRestrictions.interface';

class DietaryRestrictionsRoute implements Route {
  public path = '/restrictions';
  public router = Router();

  private dietaryRestrictionsController: DietaryRestrictionsControllerInterface;

  constructor(dietaryRestrictionsController: DietaryRestrictionsControllerInterface) {
    this.dietaryRestrictionsController = dietaryRestrictionsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.dietaryRestrictionsController.getAllRestrictions);
  }
}

export default DietaryRestrictionsRoute;
