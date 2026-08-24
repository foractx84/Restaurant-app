import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { ModifierControllerInterface } from '@interfaces/modifier.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import { DeleteModifierDto } from '@/dtos/modifier.dto';
import { checkModifierAndRestaurantIDMiddleware } from '@/middlewares/checkModifierAndRestaurantID.middleware';

class ModifiersRoute implements Route {
  public path = '/modifiers';
  public router = Router();

  private modifierController: ModifierControllerInterface;

  constructor(modifierController: ModifierControllerInterface) {
    this.modifierController = modifierController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.modifierController.getModifiers);
    this.router.delete(
      '/:modifierID',
      validationMiddleware(DeleteModifierDto, 'params'),
      checkModifierAndRestaurantIDMiddleware,
      this.modifierController.deleteModifier,
    );
  }
}

export default ModifiersRoute;
