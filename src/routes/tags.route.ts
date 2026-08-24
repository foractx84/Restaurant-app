import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { TagsControllerInterface } from '@/interfaces/tags.interface';
import { checkTagNameAndColorAndRestaurantID } from '@/middlewares/tags.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { CreateTagDto } from '@/dtos/tag.dto';

class TagsRoute implements Route {
  public path = '/tags';
  public router = Router();

  private tagsController: TagsControllerInterface;

  constructor(tagsController: TagsControllerInterface) {
    this.tagsController = tagsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.tagsController.getCustomTagsAndDefaultTagsByRestaurantID);
    this.router.post(
      '/restaurant',
      validationMiddleware(CreateTagDto, 'body'),
      checkTagNameAndColorAndRestaurantID,
      this.tagsController.createRestaurantTag,
    );
  }
}

export default TagsRoute;
