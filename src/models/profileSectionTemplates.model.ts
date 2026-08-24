import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager, In } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfileSectionTemplatesModelInterface } from '@interfaces/profileSectionTemplates.interface';
import { ProfileSectionTemplateEntity } from '@entities/profileSectionTemplate.entity';

class ProfileSectionTemplatesModel implements ProfileSectionTemplatesModelInterface {
  fetchProfileSectionTemplatesByNames = async (names: string[], repository?: EntityManager): Promise<ProfileSectionTemplateEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.find(ProfileSectionTemplateEntity, {
        where: { template: In(names) },
      });
    } catch (err) {
      logger.error(`Error fetching profile section templates by name(s): ${JSON.stringify(names)}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error fetching profile section templates by name(s): ${JSON.stringify(names)}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ProfileSectionTemplatesModel;
