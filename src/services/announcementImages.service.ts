import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { AnnouncementImagesModelInterface, AnnouncementImagesServiceInterface } from '@interfaces/announcementImages.interface';
import { AnnouncementImageEntity } from '@/entities/announcementImage.entity';
import { MediaEntity } from '@entities/media.entity';

class AnnouncementImagesService implements AnnouncementImagesServiceInterface {
  private announcementImagesModel: AnnouncementImagesModelInterface;

  constructor(announcementImagesModel: AnnouncementImagesModelInterface) {
    this.announcementImagesModel = announcementImagesModel;
  }

  deleteImages = async (imageIDs: number[], announcementID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await this.announcementImagesModel.softDeleteAnnouncementImages(imageIDs, announcementID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting announcement images: ${imageIDs} for announcement: ${announcementID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting announcement images: ${imageIDs} for announcement: ${announcementID}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  insertAnnouncementImage = async (image: AnnouncementImageEntity, repository?: EntityManager): Promise<AnnouncementImageEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await this.announcementImagesModel.insertImage(image, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while inserting announcement image for announcement: ${image.announcement_id}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting announcement image for announcement: ${image.announcement_id}. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  insertAnnouncementMedia = async (announcementID: number, media: MediaEntity[], entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      await this.announcementImagesModel.insertAnnouncementMedia(
        media.map(_media => new AnnouncementImageEntity(announcementID, _media.media_id, _media.media_url)),
        entityManager,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while inserting announcement media: ${media.map(item => item.media_id)} for announcement: ${announcementID}. - ${
            err?.stack || err
          }`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting announcement media: ${media.map(
              item => item.media_id,
            )} for announcement: ${announcementID}. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  validateImagesToDelete = (existingImageIDs: number[], idsToDelete: number[]): void => {
    idsToDelete.forEach(imageID => {
      if (!existingImageIDs.includes(imageID)) {
        logger.error(`Image ID: ${imageID} does not exist for announcement.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Image ID: ${imageID} does not exist for announcement.`));
      }
    });
  };
}

export default AnnouncementImagesService;
