import { NextFunction, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ProfileSectionsModel from '@/models/profileSections.model';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { CustomRequest } from '@/interfaces/CustomRequest.interface';
import { LinkRestaurantProfileSectionMediaDto } from '@/dtos/profileSections.dto';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { MEDIA_SECTION_TEMPLATES } from '@/constants/sectionTemplates.constants';
import { ProfilePageEntity } from '@entities/profilePage.entity';

/**
 * Validates profile page section is a template type that allows for media
 * Only certain template types allow for media
 */
export const checkPageSectionTemplateTypeAndMedia = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res.locals.restaurantID);
    // get existing profile page section if exists on request
    const profilePageEntity: ProfilePageEntity = req?.metadata;

    let profileSection: ProfileSectionEntity;
    let pageSectionID: number;
    if (Object.keys(req?.body).length > 0) {
      pageSectionID = req?.body.sectionID;
    } else if (Object.keys(req?.params).length > 0) {
      pageSectionID = parseInt(req?.params.sectionID);
    }

    if (!pageSectionID || !restaurantID) {
      logger.error(`Missing ${pageSectionID ? 'restaurantID' : 'sectionID'} in request.`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing ${pageSectionID ? 'restaurantID' : 'sectionID'} in request.`),
      );
    }

    if (profilePageEntity && Object.keys(profilePageEntity).length > 0) {
      profileSection = profilePageEntity.profileSections.find(section => section.restaurantProfileSectionID === pageSectionID);
    }

    if ((profilePageEntity && Object.keys(profilePageEntity).length === 0) || !profilePageEntity || !profileSection) {
      const profileSectionsModel = new ProfileSectionsModel();
      profileSection = await profileSectionsModel.fetchPageSectionByID(pageSectionID);
    }

    if (!profileSection) {
      logger.error(`Section does not exist with sectionID: ${pageSectionID}.`);
      throw new HttpException(
        404,
        getErrorPayload(
          InternalErrorCode.inputValueNotInDB,
          `Section does not exist with sectionID: ${pageSectionID}. Please check your value and try again.`,
        ),
      );
    }

    // if section template type does not allow for media
    // i.e. template type is COPY, then throw error
    if (!profileSection?.sectionTemplate?.template || !MEDIA_SECTION_TEMPLATES.includes(profileSection?.sectionTemplate?.template)) {
      logger.warn(
        `Section template type ${
          profileSection?.sectionTemplate?.template
        } is incompatible for linking media.  Allowed template types are ${JSON.stringify(MEDIA_SECTION_TEMPLATES)}`,
      );
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.missingInputOrIncorrectType,
          `Section template type ${
            profileSection?.sectionTemplate?.template
          } is incompatible for linking media.  Allowed template types are ${JSON.stringify(MEDIA_SECTION_TEMPLATES)}`,
        ),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
