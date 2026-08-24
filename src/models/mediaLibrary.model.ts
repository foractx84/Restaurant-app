import { getCurrentDate } from '@/utils/timeUtils';
import { MediaEntity } from '@entities/media.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { HttpException, InternalErrorCode, getErrorPayload } from '@exceptions/HttpException';
import { MediaLibraryModelInterface } from '@interfaces/mediaLibrary.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { classToPlain } from 'class-transformer';
import { EntityManager, IsNull } from 'typeorm';

class MediaLibraryModel implements MediaLibraryModelInterface {
  getMediaByMediaID = async (mediaID: number): Promise<MediaEntity> => {
    try {
      const entityManager = await ormConnection();
      return await entityManager
        .getRepository(MediaEntity)
        .createQueryBuilder('media')
        .leftJoinAndSelect('media.menuItemVideoThumbnail', 'mivt', 'mivt.deleted_at IS NULL')
        .leftJoinAndSelect('media.announcementsMedia', 'am', 'am.deleted_at IS NULL')
        .leftJoinAndSelect('am.announcement', 'announcement', 'announcement.deleted_at IS NULL')
        .where('media.media_id = :media_id', { media_id: mediaID })
        .andWhere('media.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting media by mediaID ${mediaID}.`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting media by mediaID ${mediaID}.`));
      }
    }
  };

  getMediaByRestaurantID = async (restaurantID: number, sortBy?: string, repository?: EntityManager): Promise<MediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.find(MediaEntity, {
        where: {
          restaurant_id: restaurantID,
          deleted_at: IsNull(),
        },
        ...(sortBy && {
          order: {
            [sortBy]: 'ASC',
          },
        }),
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting media by restaurantID ${restaurantID} from media library. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting media by restaurantID ${restaurantID} from media library. Refer to logs for more detail`,
          ),
        );
      }
    }
  };

  getMediaByMediaURL = async (mediaURL: string): Promise<MediaEntity> => {
    try {
      const entityManager = await ormConnection();
      return await entityManager.findOne(MediaEntity, { where: { media_url: mediaURL } }); // since the UNIQUE constraint exists for media_url, we still fetch even soft deleted ones.
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting media by mediaURL ${mediaURL} of media library.`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting media by mediaURL ${mediaURL} of media library.`),
        );
      }
    }
  };

  insertMedia = async (media: MediaEntity[], repository?: EntityManager): Promise<MediaEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = await repository.getCustomRepository(PostgresQueriesRepository);
      const mediaResult = await customRepository.insert('media_library', media);
      return classToPlain(mediaResult.raw) as MediaEntity[];
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

  softDeleteMediaByMediaID = async (mediaID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(MediaEntity, { media_id: mediaID }, { deleted_at: getCurrentDate() });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting mediaID ${mediaID} of media library.`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while soft deleting mediaID ${mediaID} of media library.`),
        );
      }
    }
  };
}

export default MediaLibraryModel;
