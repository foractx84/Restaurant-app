import { NextFunction, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import ProfilePagesModel from '@/models/profilePages.model';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { EditProfilePageRequestInterface } from '@interfaces/profilePages.interface';

/**
 * Validates profile page being accessed/modified exists for restaurant provided in header
 * Only authorized restaurants will be able to access these pages
 * If page is provided and exists in our database, validates to ensure nav link and url path are correct.
 */
export const validatePageMiddleware = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction) => {
  try {
    const { body } = req || {};
    const { navLink, urlPath } = body as EditProfilePageRequestInterface;
    // get existing profile page if exists on request
    let pageEntity: ProfilePageEntity = req?.metadata;
    if ((pageEntity && Object.keys(pageEntity).length === 0) || !pageEntity) {
      // if profile page does not exist in request then fetch using id in request
      let id = '';
      if (Object.keys(req?.body).length > 0) {
        id = req?.body.pageID;
      } else if (Object.keys(req?.params).length > 0) {
        id = req?.params.pageID;
      }

      const profilePagesModel = new ProfilePagesModel();
      pageEntity = await profilePagesModel.fetchProfilePageByPageID(parseInt(id));
    }

    // if navLink exists on existing page entity and url path being removed then throw 400 Bad Request
    // if navLink updated on profile page request and url path doesn't exist or not provided then throw 400 Bad Request
    if ((!!pageEntity?.navLink && navLink !== '' && urlPath === '') || (navLink && pageEntity?.urlPath == null && !urlPath)) {
      logger.error(`Url path required with nav link. Please provide url path or remove 'nav link' and try again.`);
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.missingInputOrIncorrectType,
          `Url path required with nav link. Please provide url path or remove 'nav link' and try again.`,
        ),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
