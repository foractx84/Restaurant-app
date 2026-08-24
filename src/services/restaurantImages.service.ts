import { RestaurantImageInterface, RestaurantImagesModelInterface, RestaurantImagesServiceInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantImageEntity } from '@/entities/restaurantImage.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { RestaurantImageType } from '@/enums/restaurantImageType';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { validateMediaTotalWithMaxAllowed } from '@/utils/mediaValidationUtils';
import { MediaEntity } from '@/entities/media.entity';
import { MediaLibraryServiceInterface } from '@/interfaces/mediaLibrary.interface';
import { RestaurantImageTypesServiceInterface } from '@/interfaces/restaurantImageTypes.interface';
import { RESTAURANT_MEDIA } from '@/configs/config';
import { IMAGE_TYPE_ID } from '@/constants/media.constants';

class RestaurantImagesService implements RestaurantImagesServiceInterface {
  private restaurantImagesModel: RestaurantImagesModelInterface;
  private mediaLibraryService: MediaLibraryServiceInterface;
  private restaurantImageTypesService: RestaurantImageTypesServiceInterface;

  constructor(
    restaurantImagesModel: RestaurantImagesModelInterface,
    mediaLibraryService: MediaLibraryServiceInterface,
    restaurantImageTypesService: RestaurantImageTypesServiceInterface,
  ) {
    this.restaurantImagesModel = restaurantImagesModel;
    this.mediaLibraryService = mediaLibraryService;
    this.restaurantImageTypesService = restaurantImageTypesService;
  }

  getRestaurantImagesByRestaurantID = async (restaurantID: number): Promise<RestaurantImageInterface[]> => {
    try {
      return this.buildRestaurantImages(await this.restaurantImagesModel.findRestaurantImageEntitiesByRestaurantID(restaurantID));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error while getting restaurant images by id: ${restaurantID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error while getting restaurant images by id: ${restaurantID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  deleteImages = async (imageIDs: number[], restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await this.restaurantImagesModel.softDeleteRestaurantImages(imageIDs, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(`Error occurred while soft deleting restaurant images: ${imageIDs} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting restaurant images: ${imageIDs}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  insertRestaurantImages = async (images: RestaurantImageEntity[], repository?: EntityManager): Promise<RestaurantImageEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await this.restaurantImagesModel.insertImages(images, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(`Error occurred while inserting images ${JSON.stringify(images)}  for restaurant: ${images?.[0]?.restaurant_id} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting images ${JSON.stringify(images)} for restaurant: ${
              images?.[0]?.restaurant_id
            }. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  buildRestaurantImages = (restaurantImages: RestaurantImageEntity[]): RestaurantImageInterface[] =>
    restaurantImages.map(image => ({
      imageID: image.restaurant_image_id,
      imageURL: image.image_url,
      restaurantID: image.restaurant_id,
      restaurantImageType: image.restaurant_image_type_id?.['type'] as string,
    }));

  buildRestaurantImageEntity = (imageURL: string, restaurantID: number, restaurantImageTypeID: number): RestaurantImageEntity => ({
    restaurant_id: restaurantID,
    restaurant_image_type_id: restaurantImageTypeID,
    image_url: imageURL,
    // we need to set list order = 0 for thumbnail and menu cover in restaurant images, we either do it in a trigger or we do it here in services
  });

  setupInsertingRestaurantImages = async (images: RestaurantImageEntity[], mediaLibrary: MediaEntity[], repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      if (mediaLibrary?.length > 0) {
        // insert media library images images
        const insertedMedia = (await this.mediaLibraryService.insertMedia(mediaLibrary, repository)) || [];

        // set up foreign keys pointed to media library
        insertedMedia.forEach(media => {
          images.forEach(image => {
            if (media.media_url === image.image_url) {
              image.media_id = media.media_id;
            }
          });
        });

        // need to be inserted into old restaurant_images table (non gallery)
        // insert restaurant images into old restaurant_images table (soon to deprecate)
        let insertedRestaurantImages: RestaurantImageEntity[] = [];
        if (images?.length) {
          insertedRestaurantImages = await this.insertRestaurantImages(images, repository);
        }
        return [insertedMedia, insertedRestaurantImages];
      }
      return [];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(`Error occurred while setting up inserting restaurant images - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting up inserting restaurant images. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  setupRestaurantAndMediaLibraryImages = async (
    logoImage: string,
    menuCoverImage: string,
    profileImages: string[],
    restaurantID: number,
    thumbnailImage: string,
  ) => {
    try {
      const images: RestaurantImageEntity[] = [];
      const mediaLibrary: MediaEntity[] = [];
      const restaurantImageTypes = await this.restaurantImageTypesService.getAllRestaurantImageTypes();
      if (profileImages?.length) {
        profileImages.map(image => {
          mediaLibrary.push(new MediaEntity(image, IMAGE_TYPE_ID, restaurantID));
          images.push(
            this.buildRestaurantImageEntity(
              image,
              restaurantID,
              restaurantImageTypes?.filter(image => image?.type === 'profile')?.[0]?.restaurant_image_type_id,
            ),
          );
        });
      }
      if (logoImage) {
        mediaLibrary.push(new MediaEntity(logoImage, IMAGE_TYPE_ID, restaurantID));
        images.push(
          this.buildRestaurantImageEntity(
            logoImage,
            restaurantID,
            restaurantImageTypes?.filter(image => image?.type === 'logo')?.[0]?.restaurant_image_type_id,
          ),
        );
      }
      if (thumbnailImage) {
        mediaLibrary.push(new MediaEntity(thumbnailImage, IMAGE_TYPE_ID, restaurantID));
        images.push(
          this.buildRestaurantImageEntity(
            thumbnailImage,
            restaurantID,
            restaurantImageTypes?.filter(image => image?.type === 'thumbnail')?.[0]?.restaurant_image_type_id,
          ),
        );
      }
      if (menuCoverImage) {
        mediaLibrary.push(new MediaEntity(menuCoverImage, IMAGE_TYPE_ID, restaurantID));
        images.push(
          this.buildRestaurantImageEntity(
            menuCoverImage,
            restaurantID,
            restaurantImageTypes?.filter(image => image?.type === 'cover_photo')?.[0]?.restaurant_image_type_id,
          ),
        );
      }

      return [images, mediaLibrary, restaurantImageTypes];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(`Error occurred while setting up media library images for restaurantID ${restaurantID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting up media library images for restaurantID ${restaurantID}. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  validateRestaurantImages = async (
    imagesToDelete: number[],
    logoImage: string,
    menuCoverImage: string,
    profileImages: string[],
    restaurantID: number,
    thumbnailImage: string,
  ): Promise<void> => {
    try {
      // get restaurant_images ids
      const restaurantImages: RestaurantImageInterface[] = await this.getRestaurantImagesByRestaurantID(restaurantID);

      // check to delete them
      if (imagesToDelete?.length > 0) {
        const existingImageIDs = restaurantImages.map(restaurantImage => restaurantImage.imageID);
        this.validateImagesToDelete(existingImageIDs, imagesToDelete);
      }

      // we dont need to validate number of images uploaded for profileImages if some already exist
      // instead, we need to check against max limit of profile images
      if (profileImages?.length) {
        validateMediaTotalWithMaxAllowed(
          restaurantImages.filter(image => image.restaurantImageType === 'profile')?.length,
          imagesToDelete?.length,
          profileImages.length,
          RESTAURANT_MEDIA.MAX_RESTAURANT_PROFILE_IMAGES_VALUE,
          'Maximum number of profile images exceeded',
        );
      }
      if (logoImage || thumbnailImage || menuCoverImage) {
        this.validateRestaurantImagesByType(
          restaurantImages,
          imagesToDelete,
          [RestaurantImageType.LOGO, RestaurantImageType.THUMBNAIL, RestaurantImageType.MENU_COVER],
          { logo: logoImage, thumbnail: thumbnailImage, cover_photo: menuCoverImage },
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(`Error occurred while validating images for restaurant: ${restaurantID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while validating images for restaurant: ${restaurantID} - ${err}. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  validateImagesToDelete = (existingImageIDs: number[], idsToDelete: number[]): void => {
    idsToDelete.forEach(imageID => {
      if (!existingImageIDs.includes(imageID)) {
        logger.error(`Image ID: ${imageID} does not exist for restaurant.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Image ID: ${imageID} does not exist for restaurant.`));
      }
    });
  };

  validateRestaurantImagesByType = (
    restaurantImages: RestaurantImageInterface[],
    imagesToBeDeleted: number[],
    types: RestaurantImageType[],
    possibleImagesBeingUploaded: any,
  ): void => {
    for (const type of types) {
      for (const image of restaurantImages) {
        if (type === image.restaurantImageType && possibleImagesBeingUploaded[type] && !imagesToBeDeleted.includes(image.imageID)) {
          logger.error(`Image of type: ${type} already exists for restaurant. Must delete existing to upload a new ${type} image.`);
          throw new HttpException(
            409,
            getErrorPayload(
              InternalErrorCode.resourceConflict,
              `Image of type: ${type} already exists for restaurant. Must delete existing to upload a new ${type} image.`,
            ),
          );
        }
      }
    }
  };
}

export default RestaurantImagesService;
