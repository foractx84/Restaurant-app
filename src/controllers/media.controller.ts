import { NextFunction, Request, Response } from 'express-serve-static-core';
import { deleteMediaIfExists } from '@utils/imageUtils';
import { MediaLibraryControllerInterface, MediaLibraryServiceInterface, MediaResponseInterface } from '@/interfaces/mediaLibrary.interface';
import { MediaEntity } from '@/entities/media.entity';

class MediaLibraryController implements MediaLibraryControllerInterface {
  private mediaService: MediaLibraryServiceInterface;

  constructor(mediaService: MediaLibraryServiceInterface) {
    this.mediaService = mediaService;
  }

  createSignedURL = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.mediaService.createSignedURL(req.body.extension);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaID: number = parseInt(req.params.mediaID);
      await this.mediaService.softDeleteMediaByMediaID(mediaID);

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID);

      const media = await this.mediaService.getMediaByRestaurantID(restaurantID);
      res.json(media.map(item => item.toResponse()));
    } catch (err) {
      next(err);
    }
  };

  linkLongFormMediaToMediaLibrary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoUUID: media_url, originalFileName: name } = req.body;

      res.json(
        (
          await this.mediaService.insertVideos([{ media_url, name }] as Partial<MediaEntity[]>, parseInt(res.locals.restaurantID))
        )[0] as MediaResponseInterface,
      );
    } catch (err) {
      next(err);
    }
  };

  uploadMediaImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { files } = req;

    // some files will be uploaded as pngs by user, and although we convert them to jpegs, we want to omit the png extension on the name
    // for example, name of file might be abc.png.  We do not want to keep the extension .png when displaying name to user as the actual file
    // will be jpeg on our side.  So we .split('.')[0] to just get the "abc" filename instead of "abc.png"
    const images: Partial<MediaEntity>[] =
      files?.['images']?.map(image => ({ media_url: image?.filename, name: image?.originalname?.split('.')[0] || image?.filename })) ?? [];
    const restaurantID = parseInt(res.locals.restaurantID);

    try {
      let result: MediaResponseInterface[] = [];
      if (images.length) {
        result = await this.mediaService.insertImages(images, restaurantID);
      }
      res.json(result);
    } catch (err) {
      if (images?.length) {
        await deleteMediaIfExists(images?.map(image => image.media_url));
      }
      next(err);
    }
  };

  uploadMediaVideos = async (req: Request, res: Response, next: NextFunction) => {
    // making the functionality allow for multiple videos even though currently we only allow for 1 video uplaod at a time
    // this is so that we dont need to refactor down the road
    // the route multer middleware .env variable will block more than 1 video upload at a time for the time being
    const { files } = req;
    const videos: Partial<MediaEntity>[] =
      files?.['videos']?.map(video => ({ media_url: video?.filename, name: video?.originalname?.split('.')[0] || video?.filename })) ?? [];
    const restaurantID = parseInt(res.locals.restaurantID);

    try {
      let result: MediaResponseInterface[] = [];
      if (videos.length) {
        result = await this.mediaService.insertVideos(videos, restaurantID);
      }
      res.json(result);
    } catch (err) {
      if (videos?.length) {
        await deleteMediaIfExists(videos?.map(video => video.media_url));
      }
      next(err);
    }
  };
}

export default MediaLibraryController;
