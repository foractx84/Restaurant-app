import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { uploadImageMiddleware } from '@middlewares/uploadImage.middleware';
import { imageUpload } from '@utils/imageUtils';
import { reformatImageMiddleware } from '@middlewares/reformatImage.middleware';
import { MENU_ITEM_MEDIA, RESTAURANT_MEDIA } from '@/configs/config';
import { MediaLibraryControllerInterface } from '@/interfaces/mediaLibrary.interface';
import { checkMediaIDLinkedToRestaurantIDMiddleware } from '@/middlewares/checkMediaIDAndRestaurantID.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { LinkLongFormVideoToMediaLibraryDto, VideoSignedURLDto } from '@/dtos/media.dto';
import { handleLinkingLongFormVideo } from '@/middlewares/handleLinkingLongFormVideo.middleware';

class MediaLibraryRoute implements Route {
  public path = '/media';
  public router = Router();

  private mediaController: MediaLibraryControllerInterface;

  constructor(mediaController: MediaLibraryControllerInterface) {
    this.mediaController = mediaController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('', this.mediaController.getMedia);
    this.router.delete('/:mediaID', checkMediaIDLinkedToRestaurantIDMiddleware, this.mediaController.deleteMedia);
    this.router.post(
      '/images',
      uploadImageMiddleware(imageUpload.fields([{ name: `images` }])),
      reformatImageMiddleware,
      this.mediaController.uploadMediaImages,
    );
    this.router.post(
      '/videos',
      uploadImageMiddleware(imageUpload.fields([{ name: 'videos', maxCount: MENU_ITEM_MEDIA.MAX_MENU_ITEM_VIDEOS_VALUE }])),
      reformatImageMiddleware,
      this.mediaController.uploadMediaVideos,
    );
    this.router.post('/videoSignedURL', validationMiddleware(VideoSignedURLDto, 'body'), this.mediaController.createSignedURL);
    this.router.post(
      '/linkLongFormVideoToMediaLibrary',
      validationMiddleware(LinkLongFormVideoToMediaLibraryDto, 'body'),
      handleLinkingLongFormVideo,
      this.mediaController.linkLongFormMediaToMediaLibrary,
    );
  }
}

export default MediaLibraryRoute;
