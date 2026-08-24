import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CreateTagRequestInterface, TagsControllerInterface, TagsServiceInterface } from '@/interfaces/tags.interface';

class TagsController implements TagsControllerInterface {
  private tagsService: TagsServiceInterface;

  constructor(tagsService: TagsServiceInterface) {
    this.tagsService = tagsService;
  }

  getCustomTagsAndDefaultTagsByRestaurantID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = parseInt(res.locals.restaurantID);
      const result = await this.tagsService.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  createRestaurantTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = parseInt(res.locals.restaurantID);
      const tagData = req.body as CreateTagRequestInterface;
      const result = await this.tagsService.createRestaurantTag(tagData, restaurantID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export default TagsController;
