import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager, In } from 'typeorm';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';
import { AnnouncementImagesModelInterface } from '@interfaces/announcementImages.interface';
import { AnnouncementImageEntity } from '@entities/announcementImage.entity';
import { getCurrentDate } from '@utils/timeUtils';

class AnnouncementImagesModel implements AnnouncementImagesModelInterface {
  softDeleteAnnouncementImages = async (imageIDs: number[], announcementID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(
        AnnouncementImageEntity,
        { announcement_id: announcementID, announcement_image_id: In(imageIDs) },
        { deleted_at: getCurrentDate() },
      );
    } catch (err) {
      logger.error(`Error occurred while soft deleting announcement images: ${imageIDs} for announcement: ${announcementID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while soft deleting announcement images: ${imageIDs} for announcement: ${announcementID}.  Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertImage = async (announcementImage: AnnouncementImageEntity, repository?: EntityManager): Promise<AnnouncementImageEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const result = await customRepository.insert('announcement_images', announcementImage);
      return classToPlain(result.raw[0]) as AnnouncementImageEntity;
    } catch (err) {
      logger.error(`Error occurred while inserting announcement image for announcement: ${announcementImage.announcement_id}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting announcement image for announcement: ${announcementImage.announcement_id}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertAnnouncementMedia = async (announcementImage: AnnouncementImageEntity[], entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      await entityManager.save(AnnouncementImageEntity, announcementImage);
    } catch (err) {
      logger.error(`Error occurred while inserting announcement media for announcement. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting announcement media for announcement. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default AnnouncementImagesModel;
