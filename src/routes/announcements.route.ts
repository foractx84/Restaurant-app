import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { AnnouncementsControllerInterface } from '@interfaces/announcements.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { LinkAnnouncementToMediaDto } from '@dtos/announcements.dto';
import checkMultipleMediaIDLinkedToRestaurantIDMiddleware from '@middlewares/checkMultipleMediaIDsAndRestaurantID.middleware';

class AnnouncementsRoute implements Route {
  public path = '/announcements';
  public router = Router();

  private announcementsController: AnnouncementsControllerInterface;

  constructor(announcementsController: AnnouncementsControllerInterface) {
    this.announcementsController = announcementsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.announcementsController.getAnnouncements);
    this.router.post(
      '/media',
      validationMiddleware(LinkAnnouncementToMediaDto, `body`),
      checkMultipleMediaIDLinkedToRestaurantIDMiddleware,
      this.announcementsController.linkAnnouncementToMedia,
    );
  }
}

export default AnnouncementsRoute;
