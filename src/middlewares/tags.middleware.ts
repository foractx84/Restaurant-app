import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { CreateTagRequestInterface } from '@/interfaces/tags.interface';
import TagsModel from '@/models/tags.model';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

/**
 * Verify if tag is unique by name, color and restaurantID
 * Throws exception if not valid
 */
export const checkTagNameAndColorAndRestaurantID = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantID = parseInt(res?.locals?.restaurantID);
    const tagData = req.body as CreateTagRequestInterface;
    if (!restaurantID || !tagData) {
      logger.error(`Missing ${tagData ? 'restaurantID' : 'tag data'} in checkTagNameAndColorAndRestaurantID`);
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'tag data or restaurantID missing in request'));
    }
    const tagsModel = new TagsModel();
    const tagColor = tagData.color ? tagData.color : '#05944F';
    const tagExists = await tagsModel.getTagByNameAndColorAndRestaurantID(restaurantID, tagData.name, tagColor);
    if (tagExists) {
      logger.error(`Tag: '${tagData.name}' with color: '${tagData.color}' already exists for restaurant ${restaurantID}`);
      throw new HttpException(
        409,
        getErrorPayload(
          InternalErrorCode.resourceConflict,
          `Tag: '${tagData.name}' with color: '${tagColor}' already exists for restaurant: ${restaurantID}`,
        ),
      );
    }
    return next();
  } catch (err) {
    return next(err);
  }
};
