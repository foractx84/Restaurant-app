import { RESTAURANT_MEDIA } from '@/configs/config';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  RestaurantProfileAlbumMediaModelInterface,
  RestaurantProfileAlbumMediaServiceInterface,
} from '@/interfaces/restaurantProfileAlbumMedia.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import {
  validateIDsIncluded,
  validateMediaOrderWithExistingMedia,
  validateMediaOrderWithMaxAllowed,
  validateMediaOrderWithUploads,
  validateMediaToDeleteWithMediaOrder,
  validateMediaTotalWithMaxAllowed,
} from '@/utils/mediaValidationUtils';
import { EntityManager } from 'typeorm';

class RestaurantProfileAlbumMediaService implements RestaurantProfileAlbumMediaServiceInterface {
  private restaurantProfileAlbumMediaModel: RestaurantProfileAlbumMediaModelInterface;

  constructor(restaurantProfileAlbumMediaModel: RestaurantProfileAlbumMediaModelInterface) {
    this.restaurantProfileAlbumMediaModel = restaurantProfileAlbumMediaModel;
  }

  deleteGalleryImagesByIDs = async (galleryImagesToDelete: number[], restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantProfileAlbumMediaModel.deleteGalleryImagesByIDs(galleryImagesToDelete, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when deleting gallery images to delete: ${JSON.stringify(galleryImagesToDelete)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when deleting gallery images to delete: ${JSON.stringify(galleryImagesToDelete)}`,
          ),
        );
      }
    }
  };

  insertRestaurantProfileAlbumMedia = async (
    restaurantProfileAlbumsMediaEntities: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ): Promise<RestaurantProfileAlbumMediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.restaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia(restaurantProfileAlbumsMediaEntities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred when inserting restaurant profile album media ${JSON.stringify(restaurantProfileAlbumsMediaEntities)}. - ${err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when inserting restaurant profile album media ${JSON.stringify(restaurantProfileAlbumsMediaEntities)}`,
          ),
        );
      }
    }
  };

  reorderGalleryImages = async (restaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantProfileAlbumMediaModel.reorderGalleryImages(restaurantProfileAlbumMedia, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while reordering gallery images in album. - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.databaseError, `Error occurred while reordering gallery images in album. Refer to logs for more info.`),
        );
      }
    }
  };

  // function which handles ordering list order such as galleryOrder for upload restaurant endpoint
  // does not handle video for time being, just order of images within the list order
  setupMediaListOrder = (
    albumID: number,
    images: string[],
    insertedFilesName = 'filename-',
    listOrder: string[],
    mediaInsertedResult: RestaurantProfileAlbumMediaEntity[],
  ): RestaurantProfileAlbumMediaEntity[] => {
    try {
      // from returned ids of inserted images, as well as already existing images
      // set up new list order
      if (listOrder?.length > 0) {
        const updatedListOrder = [];
        const imagesIndicesToRemove = [];
        listOrder?.forEach((mediaID, index) => {
          // image starts with "filename-""
          if (mediaID?.startsWith(insertedFilesName)) {
            // if image
            const uploadIndex = parseInt(mediaID?.split('-')[1]);
            if (images[uploadIndex]) {
              // add image list order to array
              const insertedMediaID = mediaInsertedResult?.find(
                image => image?.['media_url'] === images[uploadIndex],
              )?.restaurant_profile_album_media_id;
              updatedListOrder.push({ restaurant_profile_album_id: albumID, list_order: index, restaurant_profile_album_media_id: insertedMediaID });
              imagesIndicesToRemove.push(uploadIndex);
            } else {
              logger.error(`Error occurred with index ${uploadIndex} not existing for images array ${JSON.stringify(images)}.`);
              throw new HttpException(
                400,
                getErrorPayload(
                  InternalErrorCode.runtimeError,
                  `Error occurred with index ${uploadIndex} not existing for images array ${JSON.stringify(images)}. Refer to logs for more info.`,
                ),
              );
            }
          } else {
            // if numerical id such as "0" or "1" or "N" (not filename-N or video-N)
            updatedListOrder.push({ restaurant_profile_album_id: albumID, list_order: index, restaurant_profile_album_media_id: parseInt(mediaID) });
          }
        });

        // make a deep copy if any remaining uploaded images that need to be appended to the end of list order
        const tempImageTracker = JSON.parse(JSON.stringify(images));
        // we want to remove images that were already added to the list order in previous block
        // first we sort the indices in descending order, which will allow us to remove from back to front with splice
        imagesIndicesToRemove?.sort((a, b) => b - a).map(index => tempImageTracker?.splice(index, 1));

        // if there are any images left over that were not included in the mediaOrder array, we will append them to the end
        const currentListOrderCount = updatedListOrder?.length || 0;
        tempImageTracker?.map((imageURL, index) => {
          const imageID = mediaInsertedResult?.find(image => image?.['media_url'] === imageURL)?.restaurant_profile_album_media_id;
          updatedListOrder.push({
            restaurant_profile_album_id: albumID,
            list_order: index + currentListOrderCount,
            restaurant_profile_album_media_id: imageID,
          });
        });

        // finally return updated list order of entities
        return updatedListOrder as RestaurantProfileAlbumMediaEntity[];
      }
      return [];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while setting up media list order for albumID ${albumID}. - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting up media list order for albumID ${albumID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  validateGalleryImagesUploaded = (
    currentGalleryImageIDs: number[],
    galleryImages: string[],
    galleryOrder: string[],
    galleryImagesToDelete: number[],
  ): void => {
    try {
      // check if images to delete exist with current images, else throw 404
      if (galleryImagesToDelete?.length > 0) {
        validateIDsIncluded(currentGalleryImageIDs, galleryImagesToDelete);
      }

      // 1) check if galleryOrder contains uploaded images but no gallery image(s) are being uploaded, throw 400
      // 2) check if there are more uploaded elements in galleryOrder than images being uploaded
      validateMediaOrderWithUploads(galleryImages, galleryOrder, 'filename-');
      // check if any galleryImagesToBeDeleted are included in galleryOrder array, throw 400
      validateMediaToDeleteWithMediaOrder(galleryOrder, galleryImagesToDelete);

      // get existing length count for current gallery images and gallery images to delete
      // default to 0 for easy handling of undefined
      const uploadedImagesCount = galleryImages?.length || 0;
      const existingImageIDsCount = currentGalleryImageIDs?.length || 0;
      const imagesToDeleteCount = galleryImagesToDelete?.length || 0;

      // check if galleryOrder is larger than max number of allowed images, and if so, throw a 409
      validateMediaOrderWithMaxAllowed(galleryOrder, currentGalleryImageIDs);

      // (max number of allowed images) < (the current number of images in db) - (images to delete) + (images to upload)
      // if so, throw 400
      // have to test for gallery images!!!!
      validateMediaTotalWithMaxAllowed(
        existingImageIDsCount,
        imagesToDeleteCount,
        uploadedImagesCount,
        RESTAURANT_MEDIA.MAX_RESTAURANT_GALLERY_IMAGES_VALUE,
        'Maximum number of gallery media exceeded',
      );

      // 1) check if media to reorder exist with current gallery images, else throw 404
      // 2) check if current existing gallery images are not included in galleryOrder (unless they are being deleted), and if so, throw a 400
      validateMediaOrderWithExistingMedia(currentGalleryImageIDs, galleryOrder, galleryImagesToDelete);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while validating gallery images. - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while validating gallery images. Refer to logs for more info.`),
        );
      }
    }
  };
}

export default RestaurantProfileAlbumMediaService;
