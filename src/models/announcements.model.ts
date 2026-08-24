import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';
import { AnnouncementsModelInterface } from '@interfaces/announcements.interface';
import { AnnouncementEntity } from '@entities/announcement.entity';
import { getCurrentDate } from '@utils/timeUtils';

class AnnouncementsModel implements AnnouncementsModelInterface {
  softDeleteAnnouncement = async (announcementID: number, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(AnnouncementEntity, { announcement_id: announcementID, restaurant_id: restaurantID }, { deleted_at: getCurrentDate() });
    } catch (err) {
      logger.error(`Error while deleting announcement with announcementID: ${announcementID} for restaurant: ${restaurantID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while deleting announcement with announcementID: ${announcementID} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  fetchAnnouncementsByRestaurantIDOrNameOrID = async (
    restaurantID: number,
    includeImage: boolean,
    name?: string,
    announcementID?: number,
    repository?: EntityManager,
  ): Promise<AnnouncementEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const query = repository
        .getRepository(AnnouncementEntity)
        .createQueryBuilder('announcements')
        .leftJoinAndSelect('announcements.announcement_type', 'announcement_type')
        .leftJoinAndSelect('announcements.restaurant', 'restaurant')
        .leftJoinAndSelect('restaurant.restaurant_address', 'restaurant_address');

      if (includeImage) {
        query
          .leftJoinAndSelect('announcements.announcement_images', 'announcement_images', 'announcement_images.deleted_at IS NULL')
          .leftJoinAndSelect('announcement_images.media', 'media', 'media.deleted_at IS NULL')
          .andWhere('announcements.restaurant_id = :restaurantID AND announcements.deleted_at IS NULL', { restaurantID });
      } else {
        query.andWhere('announcements.restaurant_id = :restaurantID AND announcements.deleted_at IS NULL', { restaurantID });
      }

      if (announcementID) {
        query.orWhere(
          'announcements.announcement_id = :announcementID AND announcements.restaurant_id = :restaurantID AND announcements.deleted_at IS NULL',
          { announcementID, restaurantID },
        );
      }

      if (name) {
        query.orWhere('announcements.name = :name AND announcements.restaurant_id = :restaurantID AND announcements.deleted_at IS NULL', {
          name,
          restaurantID,
        });
      }

      return await query.getMany();
    } catch (err) {
      logger.error(`Error while fetching announcement with name: ${name} for restaurant: ${restaurantID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching announcement with name: ${name} for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  insertAnnouncement = async (announcement: AnnouncementEntity, repository?: EntityManager): Promise<AnnouncementEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = await repository.getCustomRepository(PostgresQueriesRepository);

      const announcementResult = await customRepository.insert('announcements', [announcement]);
      return classToPlain(announcementResult.raw[0]) as AnnouncementEntity;
    } catch (err) {
      logger.error(
        `Error occurred while inserting announcement: ${JSON.stringify(announcement)} for restaurant: ${announcement.restaurant_id}. - ` + err,
      );

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting announcement: ${JSON.stringify(announcement)} for restaurant: ${
            announcement.restaurant_id
          }. Refer to logs for more info.`,
        ),
      );
    }
  };

  hideAnnouncement = async (announcementID: number, hide: boolean, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(AnnouncementEntity, announcementID, { hidden: hide });
    } catch (err) {
      logger.error(`Error occurred while updating announcement: ${announcementID} hidden value to ${hide}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating announcement: ${announcementID} hidden value to ${hide}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  updateAnnouncement = async (announcement: AnnouncementEntity, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const partialAnnouncement = {
        start_date: announcement.start_date,
        end_date: announcement.end_date,
        ...(announcement.name && { name: announcement.name }),
        ...(announcement.title && { title: announcement.title }),
        ...(announcement.description && { description: announcement.description }),
        ...(announcement.submit_email !== undefined && announcement.submit_email != null && { submit_email: announcement.submit_email }),
        ...(announcement.announcement_type_id && { announcement_type_id: announcement.announcement_type_id }),
      };

      await repository.update(AnnouncementEntity, announcement.announcement_id, partialAnnouncement as unknown as AnnouncementEntity);
    } catch (err) {
      logger.error(`Error occurred while updating announcement: ${JSON.stringify(announcement)}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating announcement: ${JSON.stringify(announcement)}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default AnnouncementsModel;
