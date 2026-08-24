import { NextFunction, Request, Response } from 'express-serve-static-core';
import {
  AnnouncementsControllerInterface,
  AnnouncementsServiceInterface,
  CreateAnnouncementRequestInterface,
  EditAnnouncementRequestInterface,
  HideAnnouncementRequestInterface,
  LinkAnnouncementToMediaRequestInterface,
} from '@interfaces/announcements.interface';
import { deleteImageIfExists } from '@utils/imageUtils';
import { validateArrayOfIDs } from '@utils/util';
import { UploadAnnouncementImageRequestInterface } from '@interfaces/announcementImages.interface';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MediaEntity } from '@entities/media.entity';

class AnnouncementsController implements AnnouncementsControllerInterface {
  private announcementsService: AnnouncementsServiceInterface;

  constructor(announcementsService: AnnouncementsServiceInterface) {
    this.announcementsService = announcementsService;
  }

  createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(
        await this.announcementsService.createAnnouncement(req.body as CreateAnnouncementRequestInterface, parseInt(res?.locals?.restaurantID)),
      );
    } catch (err) {
      next(err);
    }
  };

  deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.announcementsService.deleteAnnouncement(parseInt(req.params?.announcementID), parseInt(res?.locals?.restaurantID));
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.announcementsService.editAnnouncement(req.body as EditAnnouncementRequestInterface, parseInt(res.locals.restaurantID)));
    } catch (err) {
      next(err);
    }
  };

  getAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.announcementsService.getAnnouncementsByRestaurantID(parseInt(res.locals.restaurantID)));
    } catch (err) {
      next(err);
    }
  };

  hideAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.announcementsService.hideAnnouncement(req.body as HideAnnouncementRequestInterface, parseInt(res.locals.restaurantID)));
    } catch (err) {
      next(err);
    }
  };

  linkAnnouncementToMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // retrieve media group from response - locals. Added to response in validation middleware
      const media = res.locals.media as MediaEntity[];
      await this.announcementsService.linkAnnouncementToMedia(
        req.body as LinkAnnouncementToMediaRequestInterface,
        parseInt(res.locals.restaurantID),
        media,
      );
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  uploadAnnouncementImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { body, files } = req;
    const image = files?.['image']?.[0];
    try {
      const { imagesToDelete, announcementID } = body as UploadAnnouncementImageRequestInterface;

      const idsToDelete = !!imagesToDelete ? JSON.parse(imagesToDelete) : [];
      validateArrayOfIDs(idsToDelete);

      const id = parseInt(announcementID);

      if (Number.isNaN(id)) {
        logger.error(`Provided announcementID: ${id} must be a number.`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Provided announcementID: ${id} must be a number.`),
        );
      }

      const result = await this.announcementsService.uploadAnnouncementImage(image?.filename, id, idsToDelete, parseInt(res.locals.restaurantID));
      if (result != null) {
        res.json(result);
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      /**
       * If error occurs while uploading images then we will want to roll back the upload
       */
      if (image) {
        await deleteImageIfExists(image.filename);
      }
      next(err);
    }
  };
}

export default AnnouncementsController;
