import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager, IsNull } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfileSectionsModelInterface } from '@interfaces/profileSections.interface';
import { ProfileSectionEntity } from '@entities/profileSection.entity';
import { getCurrentDate } from '@/utils/timeUtils';

class ProfileSectionsModel implements ProfileSectionsModelInterface {
  fetchProfilePageSectionByID = async (sectionID: number): Promise<ProfileSectionEntity> => {
    try {
      const entityManager: EntityManager = await ormConnection();

      return await entityManager.findOne(ProfileSectionEntity, {
        where: { restaurantProfileSectionID: sectionID, deletedAt: IsNull() },
        relations: [
          'sectionTemplate',
          'profilePage',
          'profilePage.restaurant',
          'profilePage.profileSections',
          'profilePage.profileSections.sectionTemplate',
        ],
      });
    } catch (err) {
      logger.error(`Error occurred while fetching profile page section by id ${sectionID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching profile page section by id ${sectionID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchPageSectionByID = async (sectionID: number, repository?: EntityManager): Promise<ProfileSectionEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(ProfileSectionEntity, {
        where: { restaurantProfileSectionID: sectionID, deletedAt: IsNull() },
        relations: ['profilePage', 'sectionTemplate'],
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching page sectionID: ${sectionID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching page sectionID: ${sectionID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  upsertProfileSections = async (
    profileSectionEntities: Partial<ProfileSectionEntity>[],
    repository?: EntityManager,
  ): Promise<ProfileSectionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.save(ProfileSectionEntity, profileSectionEntities);
    } catch (err) {
      logger.error(`Error upserting profile section entities: ${profileSectionEntities}. - ${err?.stack ?? err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error upserting profile section entities: ${profileSectionEntities}. Refer to logs for more info.`,
        ),
      );
    }
  };

  softDeleteProfileSection = async (sectionID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(ProfileSectionEntity, { restaurantProfileSectionID: sectionID }, { deletedAt: getCurrentDate() });
    } catch (err) {
      logger.error(`Error deleting profile section: ${sectionID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error deleting profile section: ${sectionID}. Refer to logs for more info.`),
      );
    }
  };
}

export default ProfileSectionsModel;
