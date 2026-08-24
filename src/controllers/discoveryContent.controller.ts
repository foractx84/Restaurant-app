import { NextFunction, Request, Response } from 'express-serve-static-core';
import {
  DiscoveryContentControllerInterface,
  DiscoveryContentServiceInterface,
  HideDiscoveryContentRequest,
} from '@interfaces/discoveryContent.interface';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import { CreateDiscoveryContentDto, EditDiscoveryContentDto } from '@/dtos/discoveryContent.dto';

class DiscoveryContentController implements DiscoveryContentControllerInterface {
  private discoveryContentService: DiscoveryContentServiceInterface;

  constructor(discoveryContentService: DiscoveryContentServiceInterface) {
    this.discoveryContentService = discoveryContentService;
  }

  createDiscoveryContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const discoveryContent = req.body as CreateDiscoveryContentDto;
      res.json(await this.discoveryContentService.createDiscoveryContent(discoveryContent, parseInt(res.locals.restaurantID)));
    } catch (err) {
      next(err);
    }
  };

  deleteDiscoveryContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve discoveryContent from response - locals. Added to response in validation middleware
      const discoveryContent = res.locals.discoveryContent as DiscoveryContentEntity;
      await this.discoveryContentService.softDeleteDiscoveryContent(discoveryContent);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editDiscoveryContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve discoveryContent from response - locals. Added to response in validation middleware
      const currentDiscoveryContent = res.locals.discoveryContent as DiscoveryContentEntity;

      // incoming discovery content PUT request body
      const discoveryContentRequest = req.body as EditDiscoveryContentDto;
      await this.discoveryContentService.editDiscoveryContent(currentDiscoveryContent, discoveryContentRequest, parseInt(res.locals.restaurantID));
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getDiscoveryContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.discoveryContentService.getDiscoveryContent(res.locals.restaurantID));
    } catch (err) {
      next(err);
    }
  };

  hideDiscoveryContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve discoveryContent from response - locals. Added to response in validation middleware
      const discoveryContent = res.locals.discoveryContent as DiscoveryContentEntity;
      const { hide } = req.body as HideDiscoveryContentRequest;
      await this.discoveryContentService.hideDiscoveryContent(discoveryContent, hide);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default DiscoveryContentController;
