import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager, IsNull } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfilePagesModelInterface } from '@interfaces/profilePages.interface';
import { ProfilePageEntity } from '@entities/profilePage.entity';

class ProfilePagesModel implements ProfilePagesModelInterface {
  fetchProfilePageByPageID = async (pageID: number): Promise<ProfilePageEntity> => {
    try {
      const entityManager: EntityManager = await ormConnection();
      return await entityManager
        .getRepository(ProfilePageEntity)
        .createQueryBuilder('profilePages')
        .leftJoinAndSelect('profilePages.profileSections', 'profileSections', 'profileSections.deletedAt IS NULL')
        .leftJoinAndSelect('profileSections.sectionTemplate', 'sectionTemplate')
        .leftJoinAndSelect('profileSections.mediaLink', 'mediaLink', 'mediaLink.deletedAt IS NULL')
        .leftJoinAndSelect('mediaLink.media', 'sectionMedia')
        .leftJoinAndSelect('sectionMedia.media_type', 'sectionMediaType')
        .leftJoinAndSelect('profileSections.cards', 'cards')
        .leftJoinAndSelect('cards.media', 'cardMedia')
        .leftJoinAndSelect('cardMedia.media', 'mediaLibrary', 'mediaLibrary.deleted_at IS NULL')
        .leftJoinAndSelect('mediaLibrary.media_type', 'mediaLibraryMediaType')
        .where('profilePages.restaurantProfilePageID = :pageID', { pageID })
        .andWhere('profilePages.deletedAt IS NULL')
        .orderBy({
          'profilePages.listOrder': 'ASC',
          'profileSections.listOrder': 'ASC',
          'mediaLink.listOrder': 'ASC',
          'cards.listOrder': 'ASC',
          'cardMedia.listOrder': 'ASC',
        })
        .getOne();
    } catch (err) {
      logger.error(`Error fetching profile pages by page id: ${pageID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error fetching profile pages by page id: ${pageID}. Refer to logs for more info.`),
      );
    }
  };

  fetchProfilePagesByRestaurantID = async (restaurantID: number): Promise<ProfilePageEntity[]> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      return await ormConn.find(ProfilePageEntity, {
        where: { restaurantID, deletedAt: IsNull(), isHidden: false },
      });
    } catch (err) {
      logger.error(`Error fetching profile pages by restaurant id: ${restaurantID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error fetching profile pages by restaurant id: ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  upsertProfilePage = async (profilePageEntity: Partial<ProfilePageEntity>, repository?: EntityManager): Promise<ProfilePageEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.save(ProfilePageEntity, profilePageEntity);
    } catch (err) {
      logger.error(
        `Error upserting profile page entity: ${JSON.stringify(profilePageEntity)} for restaurant: ${profilePageEntity?.restaurantID}. - ${err}`,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error upserting profile page entity: ${JSON.stringify(profilePageEntity)} for restaurant: ${
            profilePageEntity?.restaurantID
          }. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ProfilePagesModel;
