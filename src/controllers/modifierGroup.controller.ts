import { ModifierEntity } from '@/entities/modifier.entity';
import {
  CreateModifierGroupRequestInterface,
  EditModifierGroupRequestInterface,
  LinkModifiersToModifierGroupRequestInterface,
  ModifierGroupControllerInterface,
  ModifierGroupServiceInterface,
} from '@/interfaces/modifierGroup.interface';
import { Response, Request, NextFunction } from 'express-serve-static-core';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';

class ModifierGroupController implements ModifierGroupControllerInterface {
  private modifierGroupsService: ModifierGroupServiceInterface;

  constructor(modifierGroupsService: ModifierGroupServiceInterface) {
    this.modifierGroupsService = modifierGroupsService;
  }

  createModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const modifiers = res?.locals?.modifiersBeingLinked as ModifierEntity[];
      const modifierGroupData = req.body as CreateModifierGroupRequestInterface;
      res.json({ ...(await this.modifierGroupsService.createModifierGroup(modifierGroupData, parseInt(res?.locals?.restaurantID))), modifiers });
    } catch (err) {
      next(err);
    }
  };

  deleteModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve modifier group from response - locals. Added to response in validation middleware
      const modifierGroup = res.locals.modifierGroup as ModifierGroupEntity;
      await this.modifierGroupsService.softDeleteModifierGroup(modifierGroup);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve modifier group from response - locals. Added to response in validation middleware
      const modifierGroup = res?.locals?.modifierGroup as ModifierGroupEntity;
      const editRequest = req.body as EditModifierGroupRequestInterface;
      await this.modifierGroupsService.editModifierGroup(editRequest, modifierGroup);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getModifierGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = parseInt(res.locals.restaurantID);
      res.json(await this.modifierGroupsService.getModifierGroups(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  linkModifiersToModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const linkRequest = req.body as LinkModifiersToModifierGroupRequestInterface;
      await this.modifierGroupsService.linkModifiersToModifierGroup(linkRequest);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default ModifierGroupController;
