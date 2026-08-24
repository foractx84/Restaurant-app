import fs from 'fs';
import { APP_CONFIG } from '@/configs/config';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import { logger } from '@utils/logger';
import { generateMediaName, saveMedia } from '@utils/imageUtils';
import { VIDEO_MIME_TYPES } from '@/constants/videoMimeTypes.constants';

/**
 * Reformat uploaded image to jpeg if not jpeg, changes quality to 70 (out of 100).
 * Calls the `saveMedia()` function which will save the file locally or upload to the cloud.
 */
export const reformatImageMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // make directory if doesnt exist (linode only)
    if (APP_CONFIG.SERVER === 'linode') {
      if (!fs.existsSync(APP_CONFIG.IMAGE_LOCAL_PATH)) {
        fs.mkdirSync(APP_CONFIG.IMAGE_LOCAL_PATH, { recursive: true });
      }
    }

    // must use a set so it doesnt double iterate over repeats (i.e. multiple gallery image arrays)
    const uniqueFileFieldName = new Set();
    if (req.files) {
      for (const fieldNameFiles of Object.keys(req.files)) {
        if (uniqueFileFieldName.has(fieldNameFiles)) {
          continue;
        } // avoid duplicates (multiple gallery image arrays)
        uniqueFileFieldName.add(fieldNameFiles); // add fieldNameFile = "profileImages", "galleryImages", etc

        // iterate through all image file groups (galleryImages, profilesImages, etc.) in parallel via map()
        await Promise.all(
          req.files[fieldNameFiles].map(async uniqueFile => {
            // Generate UUID file name.
            const type = uniqueFile.mimetype.split('/')[0];
            const uuidFileName = generateMediaName(uniqueFile);

            // throw an error if media is an image but is not jpeg, jpg, or png
            // throw an error if media is a video but not mov, mp4, etc.
            if (
              uniqueFile.mimetype !== 'image/jpeg' &&
              uniqueFile.mimetype !== 'image/jpg' &&
              uniqueFile.mimetype !== 'image/png' &&
              !VIDEO_MIME_TYPES.includes(uniqueFile.mimetype.split('/')[1])
            ) {
              logger.error(`Media either not PNG or JPEG if an image, or not correct video extension if a video`);
              throw new Error('Unsupported media type. Please upload a PNG, JPEG, or supported video format.');
            }

            uniqueFile.filename = uuidFileName;

            try {
              await saveMedia(uniqueFile.buffer, uuidFileName, type);
            } catch (error) {
              logger.error(`Error saving image - ${error}`);
              throw error;
            }
          }),
        );
      }
    }
    next();
  } catch (err) {
    logger.error(`Error occurred while reformatting uploaded image - ${err}`);
    next(err);
  }
};
