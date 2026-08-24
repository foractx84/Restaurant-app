import { HttpException, InternalErrorCode, getErrorPayload } from '@exceptions/HttpException';
import { logger } from './logger';
import { RESTAURANT_MEDIA } from '@configs/config';

/**
 *
 * @param media media being uploaded in request
 * @param mediaOrder order of media: a) if media already exists than it is an id such as "1", and b) if media is being uploaded, than it ncludes prefix such as 'filename-'
 * @param prefix for media in mediaOrder that is being uploaded, than it is a prefix such as "filename-"
 * function checks
 * 1) if there are media being uploaded in the mediaOrder array (i.e. "filename-"), but no media is being uploaded via media array
 * 2) if there are more media being uploaded in mediaOrder ("filename-1", "filename-2", ...) than media elements in the media upload array
 */
export const validateMediaOrderWithUploads = (media: string[], mediaOrder: (string | number)[], prefix = 'filename-'): void => {
  const count = mediaOrder.filter((orderID: string | number) => orderID?.toString().startsWith(prefix)).length;
  if (media?.length === 0 && count > 0) {
    // throw exception
    logger.error(`uploaded media are in mediaOrder when no images are being uploaded in request`);
    throw new HttpException(
      400,
      getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `uploaded media are in mediaOrder when no images are being uploaded in request`),
    );
  }
  if (count > media?.length) {
    // throw exception
    logger.error(`There are more uploaded media in mediaOrder than media actually being uploaded`);
    throw new HttpException(
      400,
      getErrorPayload(
        InternalErrorCode.missingInputOrIncorrectType,
        `There are more uploaded media in mediaOrder than media actually being uploaded`,
      ),
    );
  }
};

export const validateMediaToDeleteWithMediaOrder = <T, U>(mediaOrder: T[], mediaToDelete: U[]): void => {
  if (
    mediaToDelete?.some(mediaID => mediaOrder?.includes(mediaID.toString() as T)) ||
    mediaToDelete?.some(mediaID => mediaOrder?.includes(mediaID as unknown as T))
  ) {
    logger.error(`Media ids scheduled to be deleted must not be included in the reorder array`);
    throw new HttpException(
      400,
      getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Media ids scheduled to be deleted must not be included in the reorder array`),
    );
  }
};

export const validateMediaOrderWithMaxAllowed = <T>(mediaOrder: T[], existingImageIDs: number[], prefix = 'filename-'): void => {
  const numberOfMedia =
    mediaOrder.filter(media => media.toString().startsWith(prefix) || existingImageIDs.includes(parseInt(media.toString())))?.length || 0;
  if (RESTAURANT_MEDIA.MAX_RESTAURANT_GALLERY_IMAGES_VALUE < numberOfMedia) {
    logger.error(`mediaOrder number of media ${numberOfMedia} should not be greater than ${RESTAURANT_MEDIA.MAX_RESTAURANT_GALLERY_IMAGES_VALUE}`);
    throw new HttpException(
      409,
      getErrorPayload(
        InternalErrorCode.runtimeError,
        `mediaOrder number of media ${numberOfMedia} should not be greater than ${RESTAURANT_MEDIA.MAX_RESTAURANT_GALLERY_IMAGES_VALUE}`,
      ),
    );
  }
};

/**
 * (max number of allowed media) < (the current number of media in db) - (media to delete) + (media to upload)
 * @param existingCount count of current media in database
 * @param deleteCount count of media ids being deleted
 * @param uploadedCount count of new media to be uploaded
 * @param maxAmount max amount of media allowed for type
 * @param message optional error handling message
 * // if there are more media being uploaded and media that currently exists than the max limit plus media to delete, than throw 409 resourceConflict
 **/
export const validateMediaTotalWithMaxAllowed = (
  existingCount: number,
  deleteCount: number,
  uploadedCount: number,
  maxAmount: number,
  message?: string,
): void => {
  // (max number of allowed media) < (the current number of media in db) - (media to delete) + (media to upload)
  // if so, throw 409
  if (maxAmount < existingCount + uploadedCount - deleteCount) {
    logger.error(message ?? 'Maximum number of values exceeded');
    throw new HttpException(409, getErrorPayload(InternalErrorCode.runtimeError, message ?? 'Maximum number of values exceeded'));
  }
};

export const validateMediaOrderWithExistingMedia = <T, U>(existingMediaIDs: T[], mediaOrder: U[], mediaToDelete: T[]): void => {
  if (mediaOrder?.length > 0) {
    const mediaOrderIDs = mediaOrder?.filter(item => !isNaN(parseInt(item.toString()))).map(item => parseInt(item.toString()) as T);
    validateIDsIncluded(existingMediaIDs, mediaOrderIDs);
    const missingMediaIDs = existingMediaIDs?.filter(mediaID => !mediaOrder?.includes(mediaID.toString() as U) && !mediaToDelete?.includes(mediaID));
    if (missingMediaIDs?.length) {
      logger.error(`current, existing mediaIDs ${missingMediaIDs} are missing in mediaOrder array ${JSON.stringify(missingMediaIDs)}`);
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.missingInputOrIncorrectType,
          `current, existing mediaIDs ${missingMediaIDs} are missing in mediaOrder array ${JSON.stringify(mediaOrder)}`,
        ),
      );
    }
  }
};

export const validateIDsIncluded = <T>(idsToValidate: T[], idsToCompare: T[]): void => {
  idsToCompare.forEach(mediaID => {
    if (!idsToValidate.includes(mediaID)) {
      logger.error(`Media: ${mediaID} does not exist for restaurant.`);
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Media: ${mediaID} does not exist for restaurant.`));
    }
  });
};
