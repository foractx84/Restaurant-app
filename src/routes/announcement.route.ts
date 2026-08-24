import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import validationMiddleware from '@middlewares/validation.middleware';
import { CreateAnnouncementDto, DeleteAnnouncementsDto, EditAnnouncementDto, HideAnnouncementDto } from '@dtos/announcements.dto';
import { AnnouncementsControllerInterface } from '@interfaces/announcements.interface';
import { uploadImageMiddleware } from '@middlewares/uploadImage.middleware';
import { imageUpload } from '@utils/imageUtils';
import { reformatImageMiddleware } from '@middlewares/reformatImage.middleware';

class AnnouncementRoute implements Route {
  public path = '/announcement';
  public router = Router();

  private announcementsController: AnnouncementsControllerInterface;

  constructor(announcementsController: AnnouncementsControllerInterface) {
    this.announcementsController = announcementsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', validationMiddleware(CreateAnnouncementDto, `body`), this.announcementsController.createAnnouncement);
    this.router.put('/', validationMiddleware(EditAnnouncementDto, `body`), this.announcementsController.editAnnouncement);
    this.router.post(
      `/image`,
      uploadImageMiddleware(imageUpload.fields([{ name: `image`, maxCount: 1 }])),
      reformatImageMiddleware,
      this.announcementsController.uploadAnnouncementImage,
    );
    this.router.put(`/hide`, validationMiddleware(HideAnnouncementDto, `body`), this.announcementsController.hideAnnouncement);
    this.router.delete(`/:announcementID`, validationMiddleware(DeleteAnnouncementsDto, `params`), this.announcementsController.deleteAnnouncement);
  }
}

export default AnnouncementRoute;
