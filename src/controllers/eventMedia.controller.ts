import { NextFunction, Request, Response } from 'express-serve-static-core';
import {
  EventMediaControllerInterface,
  EventMediaInsertInterface,
  EventMediaServiceInterface,
  EventMediaType,
} from '@interfaces/eventMedia.interface';
import { deleteMediaIfExists } from '@utils/imageUtils';

class EventMediaController implements EventMediaControllerInterface {
  private eventMediaService: EventMediaServiceInterface;

  constructor(eventMediaService: EventMediaServiceInterface) {
    this.eventMediaService = eventMediaService;
  }

  listEventMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      res.json(await this.eventMediaService.listEventMedia(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  uploadEventMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // `images` and `video` field names mirror the menuItem media upload route.
    // reformatImageMiddleware has already pushed the buffers to GCS and set
    // .filename on each Multer file.
    const filesByField = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
    const images: string[] = filesByField.images?.map(f => f.filename) ?? [];
    const videos: string[] = filesByField.video?.map(f => f.filename) ?? [];

    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const items: EventMediaInsertInterface[] = [
        ...images.map(fileName => ({ mediaUrl: fileName, mediaType: 'image' as EventMediaType })),
        ...videos.map(fileName => ({ mediaUrl: fileName, mediaType: 'video' as EventMediaType })),
      ];
      const created = await this.eventMediaService.insertEventMedia(restaurantID, items);
      res.json(created);
    } catch (err) {
      // Roll back any uploaded files if persistence fails so we don't leak
      // orphans in the bucket. Matches the menuItem media controller pattern.
      if (images.length || videos.length) {
        await deleteMediaIfExists(images, videos[0] ?? '');
      }
      next(err);
    }
  };

  reorderEventMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      await this.eventMediaService.reorderEventMedia(restaurantID, req.body.items);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  deleteEventMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);
      const eventMediaID = parseInt(req.params.eventMediaID);
      await this.eventMediaService.deleteEventMedia(eventMediaID, restaurantID);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

export default EventMediaController;
