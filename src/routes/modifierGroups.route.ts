import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { ModifierGroupControllerInterface } from '@interfaces/modifierGroup.interface';

class ModifierGroupsRoute implements Route {
  public path = '/modifierGroups';
  public router = Router();
  private modifierGroupsController: ModifierGroupControllerInterface;

  constructor(modifierGroupsController: ModifierGroupControllerInterface) {
    this.modifierGroupsController = modifierGroupsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.modifierGroupsController.getModifierGroups);
  }
}

export default ModifierGroupsRoute;
