import { NextFunction, Request, Response } from 'express-serve-static-core';
import {
  CreateModifierRequestInterface,
  EditModifierRequestInterface,
  ModifierControllerInterface,
  ModifierServiceInterface,
} from '@interfaces/modifier.interface';
import { ModifierEntity } from '@/entities/modifier.entity';

class ModifierController implements ModifierControllerInterface {
  private modifierService: ModifierServiceInterface;

  constructor(modifierService: ModifierServiceInterface) {
    this.modifierService = modifierService;
  }

  createModifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = req.body as CreateModifierRequestInterface;
      res.json(await this.modifierService.createModifier(request, parseInt(res?.locals?.restaurantID)));
    } catch (err) {
      next(err);
    }
  };

  deleteModifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve modifier group from response - locals. Added to response in validation middleware
      const modifier = res.locals.modifier as ModifierEntity;
      await this.modifierService.softDeleteModifier(modifier);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editModifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve modifier from response - locals. Added to response in validation middleware
      const modifier = res?.locals?.modifier as ModifierEntity;
      const editRequest = req.body as EditModifierRequestInterface;
      await this.modifierService.editModifier(editRequest, modifier);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getModifiers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = parseInt(res?.locals?.restaurantID);
      res.json(await this.modifierService.getModifiers(restaurantID));
    } catch (err) {
      next(err);
    }
  };
}

export default ModifierController;
