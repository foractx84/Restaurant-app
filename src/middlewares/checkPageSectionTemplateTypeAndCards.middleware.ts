import { NextFunction, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ProfileSectionsModel from '@/models/profileSections.model';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { CustomRequest } from '@/interfaces/CustomRequest.interface';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { SECTION_CARD_TEMPLATES } from '@/constants/sectionTemplates.constants';
import { ProfilePageEntity } from '@/entities/profilePage.entity';

/**
 * Validates profile page section is a template type that allows for cards
 * Only certain template types allow for cards
 */
export const checkPageSectionTemplateTypeAndCards = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res.locals.restaurantID);

    // get existing profile page if exists on request
    const profilePageEntity: ProfilePageEntity = req?.metadata;

    // acquire the profile section either by existing passed up page or via query if no page exists or sectionID doesnt exist for that page
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

    // page passed in via previous middleware, find specific seciton via relation sectionID
    if (profilePageEntity && Object.keys(profilePageEntity).length > 0) {
      profileSection = profilePageEntity.profileSections.find(section => section.restaurantProfileSectionID === pageSectionID);
    }

    // page not passed in via previous middleware, query for section via sectionID and grab related page tied to it
    if ((profilePageEntity && Object.keys(profilePageEntity).length === 0) || !profilePageEntity || !profileSection) {
      const profileSectionsModel = new ProfileSectionsModel();
      profileSection = await profileSectionsModel.fetchPageSectionByID(pageSectionID);
    }

    // if profile section doesnt exist
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

    // if profile section template does not match allowed types for cards
    if (!profileSection?.sectionTemplate?.template || !SECTION_CARD_TEMPLATES.includes(profileSection?.sectionTemplate?.template)) {
      logger.error(
        `Section template type ${profileSection?.sectionTemplate?.template} is incompatible for creating / editing cards.  Allowed section template  types for creating / editing card are ${SECTION_CARD_TEMPLATES}.`,
      );
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.missingInputOrIncorrectType,
          `Section template type ${profileSection?.sectionTemplate?.template} is incompatible for creating / editing cards.  Allowed section template  types for creating / editing card are ${SECTION_CARD_TEMPLATES}.`,
        ),
      );
    }

    // add page entity to request object
    req.metadata = profilePageEntity && Object.keys(profilePageEntity).length > 0 ? profilePageEntity : profileSection.profilePage;
    next();
  } catch (err) {
    next(err);
  }
};
