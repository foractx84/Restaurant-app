import { NextFunction, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ProfilePagesModel from '@/models/profilePages.model';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { CreateProfileSectionRequest, ProfileSectionInterface } from '@interfaces/profileSections.interface';
import { ProfileSectionEntity } from '@entities/profileSection.entity';

/**
 * Validates profile section being accessed/modified exists for restaurant provided in header
 * Only authorized restaurants will be able to access these profile sections
 * Ensures name, url path, and sub-navigation are unique for single profile page
 * If section is provided and exists in our database, validates to ensure sub-navigation and url path are correct.
 */
export const validatePageSectionMiddleware = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => {
  try {
    const { body } = req || {};
    const request = body as CreateProfileSectionRequest | ProfileSectionInterface;
    const { name, subNav, urlPath } = request;

    let pageID = -1;
    let sectionID = -1;

    let pageEntity: ProfilePageEntity = req?.metadata;

    if ('pageID' in request) {
      // Handle logic for CreateProfileSectionRequest
      // get existing profile page if exists on request
      if ((pageEntity && Object.keys(pageEntity).length === 0) || !pageEntity) {
        // if profile page does not exist in request then fetch using id in request
        if (Object.keys(req?.body).length > 0) {
          pageID = req?.body.pageID;
        } else if (Object.keys(req?.params).length > 0) {
          pageID = parseInt(req?.params.pageID);
        }

        const profilePagesModel = new ProfilePagesModel();
        pageEntity = await profilePagesModel.fetchProfilePageByPageID(pageID);
      }
    } else if ('sectionID' in request) {
      sectionID = request.sectionID;
    }

    const existingProfileSections: ProfileSectionEntity[] = pageEntity?.profileSections ?? [];
    if (sectionID > -1) {
      // for editing section
      const existingSection: ProfileSectionEntity = existingProfileSections.find(section => section.restaurantProfileSectionID === sectionID);
      const sectionsToValidate: ProfileSectionEntity[] = existingProfileSections.filter(section => section.restaurantProfileSectionID !== sectionID);

      if (request.template.trim().toLowerCase() !== existingSection.sectionTemplate.template) {
        logger.warn(
          `Provided template is different from the existing template for the section. Please provide the correct template: ${existingSection.sectionTemplate.template} and try again.`,
        );
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            `Provided template is different from the existing template for the section. Please provide the correct template: ${existingSection.sectionTemplate.template} and try again.`,
          ),
        );
      }

      if (request.subNav && !request.urlPath && !existingSection.urlPath) {
        // if adding sub navigation but no url path existing or provided then throw exception
        logger.warn(
          "Url path is required with 'subNav'. There is not an existing value for the profile section and none provided. Please provide 'urlPath' or remove 'subNav' and try again.",
        );
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            "Url path is required with 'subNav'. There is not an existing value for the profile section and none provided. Please provide 'urlPath' or remove 'subNav' and try again.",
          ),
        );
      }

      if (request.urlPath === '' && existingSection.subNav && request.subNav !== '' && request.subNav !== undefined) {
        // if removing url path and sub navigation exists on profile section
        logger.warn(
          "Url path is required with 'subNav'. Removing urlPath while the profile section has a subNav is not allowed. Please provide 'urlPath' or remove 'subNav' and try again.",
        );
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            "Url path is required with 'subNav'. Removing urlPath while the profile section has a subNav is not allowed. Please provide 'urlPath' or remove 'subNav' and try again.",
          ),
        );
      }

      if (sectionsToValidate?.length > 0) {
        // ensure provided section name is unique
        if (name) {
          const conflictingName: ProfileSectionEntity = sectionsToValidate?.find(
            (section: ProfileSectionEntity) => section.name === name.trim() && !section.isHidden,
          );
          if (conflictingName) {
            logger.warn(
              `Existing duplicate section name detected: "${name?.trim()}". Please ensure each section has a unique name value and try again.`,
            );
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `Existing duplicate section name detected: "${name?.trim()}". Please ensure each section has a unique name value and try again.`,
              ),
            );
          }
        }

        // ensure url path is unique
        if (urlPath) {
          const conflictingUrlPath: ProfileSectionEntity = sectionsToValidate?.find(
            (section: ProfileSectionEntity) => section.urlPath === urlPath.trim() && !section.isHidden,
          );
          if (conflictingUrlPath) {
            logger.warn(
              `Existing duplicate section urlPath detected: "${urlPath.trim()}". Please ensure each section has a unique urlPath value and try again.`,
            );
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `Existing duplicate section urlPath detected: "${urlPath.trim()}". Please ensure each section has a unique urlPath value and try again.`,
              ),
            );
          }
        }

        if (subNav) {
          const conflictingSubNav: ProfileSectionEntity = sectionsToValidate?.find(
            (section: ProfileSectionEntity) => section.subNav === subNav.trim() && !section.isHidden,
          );
          if (conflictingSubNav) {
            logger.warn(
              `Existing duplicate section subNav detected: "${subNav.trim()}". Please ensure each section has a unique subNav value and try again.`,
            );
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `Existing duplicate section subNav detected: "${subNav.trim()}". Please ensure each section has a unique subNav value and try again.`,
              ),
            );
          }
        }
      }
    } else {
      // for creating section
      if (existingProfileSections?.length > 0) {
        // ensure provided section name is unique
        const conflictingName: ProfileSectionEntity = existingProfileSections?.find(
          (section: ProfileSectionEntity) => section.name === name.trim() && !section.isHidden,
        );
        if (conflictingName) {
          logger.warn(
            `Existing duplicate section name detected: "${name?.trim()}". Please ensure each section has a unique name value and try again.`,
          );
          throw new HttpException(
            409,
            getErrorPayload(
              InternalErrorCode.resourceConflict,
              `Existing duplicate section name detected: "${name?.trim()}". Please ensure each section has a unique name value and try again.`,
            ),
          );
        }

        // ensure url path is unique
        if (urlPath) {
          const conflictingUrlPath: ProfileSectionEntity = existingProfileSections?.find(
            (section: ProfileSectionEntity) => section.urlPath === urlPath.trim() && !section.isHidden,
          );
          if (conflictingUrlPath) {
            logger.warn(
              `Existing duplicate section urlPath detected: "${urlPath.trim()}". Please ensure each section has a unique urlPath value and try again.`,
            );
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `Existing duplicate section urlPath detected: "${urlPath.trim()}". Please ensure each section has a unique urlPath value and try again.`,
              ),
            );
          }
        }

        if (subNav) {
          const conflictingSubNav: ProfileSectionEntity = existingProfileSections?.find(
            (section: ProfileSectionEntity) => section.subNav === subNav.trim() && !section.isHidden,
          );
          if (conflictingSubNav) {
            logger.warn(
              `Existing duplicate section subNav detected: "${subNav.trim()}". Please ensure each section has a unique subNav value and try again.`,
            );
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `Existing duplicate section subNav detected: "${subNav.trim()}". Please ensure each section has a unique subNav value and try again.`,
              ),
            );
          }
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
