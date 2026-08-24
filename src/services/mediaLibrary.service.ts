import { APP_CONFIG } from '@/configs/config';
import { IMAGE_TYPE_ID, VIDEO_TYPE_ID } from '@/constants/media.constants';
import { MediaEntity } from '@/entities/media.entity';
import { AnnouncementType, AnnouncementTypeNumberMapper } from '@/enums/announcementType';
import { MediaType } from '@/enums/mediaType';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import {
  MediaLibraryModelInterface,
  MediaLibraryServiceInterface,
  MediaResponseInterface,
  CreateSignedURLResponse,
} from '@/interfaces/mediaLibrary.interface';
import { createSignedURLUtility } from '@/utils/GCP_bucket';
import { ormConnection } from '@/utils/dbUtils';
import { generateVideoNameWithOnlyExtensionProvided } from '@/utils/imageUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class MediaLibraryService implements MediaLibraryServiceInterface {
  private mediaLibraryModel: MediaLibraryModelInterface;

  constructor(mediaLibraryModel: MediaLibraryModelInterface) {
    this.mediaLibraryModel = mediaLibraryModel;
  }

  createSignedURL = async (extension: string): Promise<CreateSignedURLResponse> => {
    try {
      const fileName = generateVideoNameWithOnlyExtensionProvided(extension);

      const signedURL = await createSignedURLUtility(APP_CONFIG.IMAGE_BUCKET, fileName);

      return {
        signedURL: signedURL || '',
        fileName: fileName || '',
        videoUUID: fileName?.split('.')[0] || '',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating signed url of extension ${extension} - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating signed url of extension ${extension}.`),
        );
      }
    }
  };

  getMediaByMediaID = async (mediaID: number): Promise<MediaEntity> => {
    try {
      return await this.mediaLibraryModel.getMediaByMediaID(mediaID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting media by mediaID ${mediaID}.`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting media by mediaID ${mediaID}.`));
      }
    }
  };

  getMediaByRestaurantID = async (restaurantID: number): Promise<MediaEntity[]> => {
    try {
      return await this.mediaLibraryModel.getMediaByRestaurantID(restaurantID, 'created_at');
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting media for restaurant ${restaurantID}.`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting media for restaurant ${restaurantID}.`),
        );
      }
    }
  };

  insertImages = async (images: Partial<MediaEntity>[], restaurantID: number, repository?: EntityManager): Promise<MediaResponseInterface[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const result: MediaEntity[] = await this.mediaLibraryModel.insertMedia(
        images.map(image => MediaEntity.createEntityFromRequest(image.media_url, restaurantID, MediaType.IMAGE, image.name || image.media_url)),
      );
      return result?.map(media =>
        new MediaEntity(media.media_url, IMAGE_TYPE_ID, restaurantID, media.name || media.media_url, media.media_id)?.toResponse(),
      ) as MediaResponseInterface[];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while inserting media for restaurant ${restaurantID} into media library. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting media for restaurant ${restaurantID} into media library. Refer to logs for more details.`,
          ),
        );
      }
    }
  };

  insertMedia = async (media: MediaEntity[], repository?: EntityManager): Promise<MediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.mediaLibraryModel.insertMedia(media, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while inserting media ${JSON.stringify(media)} into media library.`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while inserting media ${JSON.stringify(media)} into media library.`),
        );
      }
    }
  };

  insertVideos = async (videos: Partial<MediaEntity>[], restaurantID: number, repository?: EntityManager): Promise<MediaResponseInterface[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const result: MediaEntity[] = await this.mediaLibraryModel.insertMedia(
        videos.map(video => MediaEntity.createEntityFromRequest(video.media_url, restaurantID, MediaType.VIDEO, video.name)),
      );
      return result?.map(media =>
        new MediaEntity(media.media_url, VIDEO_TYPE_ID, restaurantID, media.name || media.media_url, media.media_id)?.toResponse(),
      ) as MediaResponseInterface[];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while inserting media video for restaurant ${restaurantID} into media library. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting media video for restaurant ${restaurantID} into media library. Refer to logs for more details.`,
          ),
        );
      }
    }
  };

  softDeleteMediaByMediaID = async (mediaID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      const existingMedia: MediaEntity = await this.getMediaByMediaID(mediaID);
      const menuItemVideoThumbnail = existingMedia?.menuItemVideoThumbnail?.find(thumbnail => thumbnail.mediaID === mediaID);
      if (menuItemVideoThumbnail) {
        logger.error(`Media is type thumbnail and tied to a video so cannot be deleted: ${mediaID}.`);
        throw new HttpException(
          409,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Media is type thumbnail and tied to a video so cannot be deleted: ${mediaID}. Refer to logs for more detail.`,
          ),
        );
      }

      const announcement = existingMedia?.announcementsMedia?.find(announcementMedia => announcementMedia.mediaID === mediaID)?.announcement;
      if (AnnouncementTypeNumberMapper[announcement?.announcement_type_id] === AnnouncementType.EMBED) {
        logger.error(`Media is type annoucement embed and cannot be deleted: ${mediaID}.`);
        throw new HttpException(
          409,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Media is type annoucement embed and cannot be deleted: ${mediaID}. Refer to logs for more detail.`,
          ),
        );
      }

      await this.mediaLibraryModel.softDeleteMediaByMediaID(mediaID, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting media: ${mediaID}. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while soft deleting mediaID ${mediaID}. Refer to logs for more detail.`),
        );
      }
    }
  };
}

export default MediaLibraryService;
