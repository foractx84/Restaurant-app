import { APP_CONFIG } from '@/configs/config';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { buildURL } from '@utils/imageUtils';
import { ERRORS } from '@/constants/errors.constants';
import { createTranscodingJob } from '@/utils/transcodeUtils';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { checkFileExists } from '@/utils/GCP_bucket';

/**
 *  First checks if a url file name already exists in the media library -> throw 409 if so
 *  Secondly, checks if original file exists up on the GCP cloud storage bucket -> if not, throw 404
 *  Third, creates and runs a transcoder API job on the movie video file -> if fails, continue on and client side fetches original video file instead of HLS version
 *  We'll need to handle for the 7 min delay functionality for video transcoder in order to handle some sort of notification system to let us know that the transcoder job passed / failed
 */
export const handleLinkingLongFormVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req?.body?.videoUUID) {
      // do a check if video file already exists for proper error messaging before initiating the video transcoder (dont want to run job if HLS video already exists)
      // cant create a duplicate of uuid in media_library (UNIQUE constraint) and we dont want duplicates
      const uuid: string = req?.body?.videoUUID;
      const mediaEntity = new MediaLibraryModel();
      const video = await mediaEntity.getMediaByMediaURL(uuid);
      if (video) {
        logger.error(`Media library media_url ${video?.media_url} already exists in media library`);
        throw new HttpException(
          409,
          getErrorPayload(InternalErrorCode.resourceConflict, `Media library media_url ${video?.media_url} already exists in media library`),
        );
      }

      // check if original video exists on the cloud first before adding it to the database
      // want to check on the cloud of the original video file exists in /videos/original/<some_uuid>.<ext> before iniating the transcoder job as well
      const inputFilePath = `${buildURL(APP_CONFIG.VIDEO_LOCAL_PATH)}${uuid}`;
      const file = await checkFileExists(APP_CONFIG.IMAGE_BUCKET, inputFilePath);

      if (!file) {
        logger.error(`media_url ${uuid} does not exist up on GCP storage cloud, cannot link it to media library`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            `media_url ${uuid} does not exist up on GCP storage cloud, cannot link it to media library`,
          ),
        );
      }

      try {
        // initiate the video transcoder job
        // grab from /videos/original/<uuid>.mp4 -> transcode to HLS -> write HLS video to videos/<uuid>  (notice there is not tacked on extension such as mp4 for the HLS video, such as <uuid>.mp4)
        const [response] = await createTranscodingJob(inputFilePath, `videos/${uuid?.split('.')?.[0]}/`);
        logger.info(`Transcoding job created succesfully: ${response?.name}`);
      } catch (err) {
        // biggest question is if we want to continue if the video transcoder job fails
        // it comes down to client side and if both Webmenus and iOS pull the original video file (i.e. mp4, mov) if the HLS version isnt existing up on the cloud???
        // if not, then we need to throw error and discontinue
        // else, proceed on and log it
        logger.error(`${ERRORS.TRANSCODING_JOB}: Could not create video transcoding job`);
      }
    }

    next();
  } catch (err) {
    logger.error(`Error occurred while linking long form video file ${req?.body?.videoUUID} and name ${req?.body?.originalFileName}- ${err}`);
    next(err);
  }
};
