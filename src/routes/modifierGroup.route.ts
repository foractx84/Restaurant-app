import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { ModifierGroupControllerInterface } from '@interfaces/modifierGroup.interface';
import { CreateModifierGroupDto, DeleteModifierGroupDto, EditModifierGroupDto, LinkModifiersToModifierGroupDto } from '@dtos/modifierGroup.dto';
import { modifiersLinkedToRestaurantMiddleware } from '@middlewares/modifiersLinkedToRestaurant';
import { checkModifierGroupAndRestaurantIDMiddleware } from '@middlewares/checkModifierGroupAndRestaurantID.middleware';

class ModifierGroupRoute implements Route {
  public path = '/modifierGroup';
  public router = Router();
  private modifierGroupsController: ModifierGroupControllerInterface;

  constructor(modifierGroupsController: ModifierGroupControllerInterface) {
    this.modifierGroupsController = modifierGroupsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      validationMiddleware(CreateModifierGroupDto, 'body'),
      modifiersLinkedToRestaurantMiddleware,
      this.modifierGroupsController.createModifierGroup,
    );
    this.router.put(
      '/',
      validationMiddleware(EditModifierGroupDto, 'body'),
      checkModifierGroupAndRestaurantIDMiddleware,
      this.modifierGroupsController.editModifierGroup,
    );
    this.router.delete(
      '/:modifierGroupID',
      validationMiddleware(DeleteModifierGroupDto, 'params'),
      checkModifierGroupAndRestaurantIDMiddleware,
      this.modifierGroupsController.deleteModifierGroup,
    );
    this.router.put(
      '/modifiers',
      validationMiddleware(LinkModifiersToModifierGroupDto, 'body'),
      modifiersLinkedToRestaurantMiddleware,
      this.modifierGroupsController.linkModifiersToModifierGroup,
    );
  }
}

export default ModifierGroupRoute;
