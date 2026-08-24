import { MediaEntity } from '@/entities/media.entity';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import { RestaurantProfileAlbumsEntity } from '@/entities/restaurantProfileAlbums.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { RestaurantProfileAlbumMediaServiceInterface } from '@/interfaces/restaurantProfileAlbumMedia.interface';
import { RestaurantProfileAlbumsModelInterface, RestaurantProfileAlbumsServiceInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantProfileAlbumsService implements RestaurantProfileAlbumsServiceInterface {
  private restaurantProfileAlbumsModel: RestaurantProfileAlbumsModelInterface;
  private restaurantProfileAlbumMediaService: RestaurantProfileAlbumMediaServiceInterface;

  constructor(
    restaurantProfileAlbumsModel: RestaurantProfileAlbumsModelInterface,
    restaurantProfileAlbumMediaService: RestaurantProfileAlbumMediaServiceInterface,
  ) {
    this.restaurantProfileAlbumsModel = restaurantProfileAlbumsModel;
    this.restaurantProfileAlbumMediaService = restaurantProfileAlbumMediaService;
  }

  deleteGalleryImagesByIDsForAlbum = async (galleryImagesToDelete: number[], restaurantID: number, repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantProfileAlbumMediaService.deleteGalleryImagesByIDs(galleryImagesToDelete, restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when deleting gallery images by ids for album. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when deleting gallery images by ids for album.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  getRestaurantProfileAlbumsByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantProfileAlbumsEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.restaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID(restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when getting restaurant profile albums by restaurantID ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when getting restaurant profile albums by restaurantID ${restaurantID}.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  insertRestaurantProfileAlbums = async (
    restaurantProfileAlbumsEntities: RestaurantProfileAlbumsEntity[],
    repository?: EntityManager,
  ): Promise<RestaurantProfileAlbumsEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.restaurantProfileAlbumsModel.insertRestaurantProfileAlbums(restaurantProfileAlbumsEntities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when inserting restaurant profile albums ${JSON.stringify(restaurantProfileAlbumsEntities)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when inserting restaurant profile albums ${JSON.stringify(
              restaurantProfileAlbumsEntities,
            )}.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  setupGalleryImagesListOrder = async (
    albumID: number,
    galleryImages: string[],
    galleryOrder: string[],
    insertedRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      if (galleryOrder?.length) {
        await this.restaurantProfileAlbumMediaService.reorderGalleryImages(
          this.restaurantProfileAlbumMediaService.setupMediaListOrder(
            albumID,
            galleryImages,
            'filename-',
            galleryOrder,
            insertedRestaurantProfileAlbumMedia,
          ),
          repository,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when setting up gallery list order for albumID ${albumID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when setting up gallery list order for albumID ${albumID}.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  setupInsertingAlbumAndGalleryImages = async (
    galleryImages: string[],
    insertedAlbums: RestaurantProfileAlbumsEntity[],
    insertedMedia: MediaEntity[],
    restaurantID: number,
    insertedRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[],
    repository?: EntityManager,
  ): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      // if no album exist, then insert default album for restaurant
      if (!insertedAlbums || !insertedAlbums?.length) {
        // handle undefines and empty arrays
        insertedAlbums.push(...(await this.insertRestaurantProfileAlbums([{ name: 'default', restaurant_id: restaurantID }], repository)));
      }

      // for MVP, just 1 album exists (default), get the id of this album
      const albumID = insertedAlbums[0]?.restaurant_profile_album_id;

      // set up the FK for gallery images (media_library and also restaurant_profile_albums)
      const galleryImageEntities = insertedMedia
        ?.map(media => {
          return galleryImages?.map(imageUUID => {
            if (media.media_url === imageUUID) {
              return {
                restaurant_profile_album_id: albumID,
                media_id: media.media_id,
              };
            }
          });
        })
        ?.reduce((acc, entities) => {
          return acc?.concat(entities?.filter(Boolean)); // filter out undefines
        }, []) as unknown as RestaurantProfileAlbumMediaEntity[];
      // now link the gallery images to the default album via FK and also to the media library via FK
      insertedRestaurantProfileAlbumMedia.push(
        ...(await this.restaurantProfileAlbumMediaService.insertRestaurantProfileAlbumMedia(galleryImageEntities, repository)),
      );

      // add the media_url for the gallery image to return in the response later
      insertedRestaurantProfileAlbumMedia.forEach(galleryImage => {
        insertedMedia.forEach(media => {
          if (galleryImage.media_id === media.media_id) {
            galleryImage['media_url'] = media.media_url;
          }
        });
      });

      // set the album gallery images (for MVP just 1 default album)
      insertedAlbums[0].restaurant_profile_album_media = insertedRestaurantProfileAlbumMedia;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when setting up inserting albums and gallery images for restaurantID ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when setting up inserting albums and gallery images for restaurantID ${restaurantID}.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  // get existing gallery images via getting albums of restaurant,
  // then checks validation these existing gallery images with uploaded gallery images, gallery images to delete
  // and reordered gallery images
  // if validation passes, it returns back the current restaurant album(s)
  validateGalleryImageUploadAndFetchRestaurantAlbums = async (
    galleryImages: string[],
    galleryImagesToDelete: number[],
    galleryOrder: string[],
    restaurantID: number,
  ): Promise<RestaurantProfileAlbumsEntity[]> => {
    try {
      // check if default album exists already, else set to empty array
      const currentRestaurantAlbums = (await this.getRestaurantProfileAlbumsByRestaurantID(restaurantID)) || [];
      // get currentGalleryImageIDs of all albums for restaurant
      const currentGalleryImageIDs: number[] = currentRestaurantAlbums
        ?.sort((a, b) => a.list_order - b.list_order)
        ?.map(album => album.restaurant_profile_album_media?.map(media => media.restaurant_profile_album_media_id))
        ?.reduce((acc, curVal) => {
          return acc.concat(curVal);
        }, []);

      // handle gallery images validation via album (upload, deleting, reordering)
      this.validateGalleryImagesUploadedForAlbum(currentGalleryImageIDs, galleryImages, galleryImagesToDelete, galleryOrder);

      // return album(s) if exists for retaurant, else empty array
      return currentRestaurantAlbums;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when setting up fetching album and gallery image ids of restaurantID ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when setting up fetching album and gallery image ids of restaurantID ${restaurantID}.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  validateGalleryImagesUploadedForAlbum = (
    currentGalleryImageIDs: number[],
    galleryImages: string[],
    galleryImagesToDelete: number[],
    galleryOrder: string[],
  ): void => {
    try {
      this.restaurantProfileAlbumMediaService.validateGalleryImagesUploaded(
        currentGalleryImageIDs,
        galleryImages,
        galleryOrder,
        galleryImagesToDelete,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when validating gallery images uploaded for album. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when validating gallery images uploaded for album.  Refer to logs for more detail.`,
          ),
        );
      }
    }
  };
}

export default RestaurantProfileAlbumsService;
