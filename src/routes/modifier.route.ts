import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { ModifierControllerInterface } from '@interfaces/modifier.interface';
import { CreateModifierDto, EditModifierDto } from '@dtos/modifier.dto';
import { checkModifierAndRestaurantIDMiddleware } from '@middlewares/checkModifierAndRestaurantID.middleware';

class ModifierRoute implements Route {
  public path = '/modifier';
  public router = Router();

  private modifierController: ModifierControllerInterface;

  constructor(modifierController: ModifierControllerInterface) {
    this.modifierController = modifierController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', validationMiddleware(CreateModifierDto, 'body'), this.modifierController.createModifier);
    this.router.put('/', validationMiddleware(EditModifierDto, 'body'), checkModifierAndRestaurantIDMiddleware, this.modifierController.editModifier);
  }
}

export default ModifierRoute;
