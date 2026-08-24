import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { EventMediaIdParamDto, ReorderEventMediaBodyDto } from '@dtos/eventMedia.dto';
import { EventMediaControllerInterface } from '@interfaces/eventMedia.interface';
import { uploadImageMiddleware } from '@middlewares/uploadImage.middleware';
import { imageUpload } from '@utils/imageUtils';
import { reformatImageMiddleware } from '@middlewares/reformatImage.middleware';
import { EVENT_MEDIA } from '@/configs/config';

class EventMediaRoute implements Route {
  public path = '/eventMedia';
  public router = Router();

  private eventMediaController: EventMediaControllerInterface;

  constructor(eventMediaController: EventMediaControllerInterface) {
    this.eventMediaController = eventMediaController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.eventMediaController.listEventMedia);
    this.router.post(
      '/',
      uploadImageMiddleware(
        imageUpload.fields([
          { name: 'images', maxCount: EVENT_MEDIA.MAX_EVENT_IMAGES },
          { name: 'video', maxCount: EVENT_MEDIA.MAX_EVENT_VIDEOS },
        ]),
      ),
      reformatImageMiddleware,
      this.eventMediaController.uploadEventMedia,
    );
    this.router.put('/reorder', validationMiddleware(ReorderEventMediaBodyDto, 'body'), this.eventMediaController.reorderEventMedia);
    this.router.delete('/:eventMediaID', validationMiddleware(EventMediaIdParamDto, 'params'), this.eventMediaController.deleteEventMedia);
  }
}

export default EventMediaRoute;
