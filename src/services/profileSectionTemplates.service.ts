import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { ProfileSectionTemplatesModelInterface, ProfileSectionTemplatesServiceInterface } from '@interfaces/profileSectionTemplates.interface';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

class ProfileSectionTemplatesService implements ProfileSectionTemplatesServiceInterface {
  private profileSectionTemplatesModel: ProfileSectionTemplatesModelInterface;

  constructor(profileSectionTemplatesModel: ProfileSectionTemplatesModelInterface) {
    this.profileSectionTemplatesModel = profileSectionTemplatesModel;
  }

  getProfileSectionTemplatesByNames = async (names: string[], repository?: EntityManager): Promise<ProfileSectionTemplateEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      // ensure no duplicate names
      const filteredNames: string[] = Array.from(new Set(names));
      const templates: ProfileSectionTemplateEntity[] = await this.profileSectionTemplatesModel.fetchProfileSectionTemplatesByNames(
        filteredNames,
        repository,
      );

      if (templates.length !== filteredNames.length) {
        const faultyNames = filteredNames
          .map((name: string) => (!templates.map(template => template.template).includes(name) ? name : ''))
          .filter((name: string) => name);
        logger.error(`Provided template names: ${faultyNames} do not exist.`);
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            `The template name(s): ${filteredNames
              .map((name: string) => (!faultyNames.includes(name) ? `${name}, ` : ''))
              .filter((name: string) => name)} do not exist. Please check your spelling or choose a different template.`,
          ),
        );
      }

      return templates;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while retrieving profile section templates by name: ${names}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while retrieving profile section templates by name: ${names}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };
}

export default ProfileSectionTemplatesService;
