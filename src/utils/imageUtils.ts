import fs from 'fs';
import multer from 'multer';
import { Request } from 'express-serve-static-core';
import { APP_CONFIG } from '@configs/config';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import sharp from 'sharp';
import { logger } from '@utils/logger';
import { createTranscodingJob } from './transcodeUtils';
import { VIDEO_MIME_TYPES } from '@constants/videoMimeTypes.constants';
import { ERRORS } from '@/constants/errors.constants';
import { getBucket } from '@utils/GCP_bucket';

const imageTypesAreValid = (file: Express.Multer.File) => {
  return file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png';
};

const videoTypesAreValid = (file: Express.Multer.File) => {
  return VIDEO_MIME_TYPES.includes(file.mimetype.split('/')[1]);
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (imageTypesAreValid(file) || videoTypesAreValid(file)) {
    cb(null, true);
  } else {
    cb(new Error(ERRORS.INVALID_FILE_EXTENSION), false);
  }
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: APP_CONFIG.MAX_MULTER_FILE_SIZE_LIMIT, // 75MB video size accepted
  },
  fileFilter,
});

export const generateMediaName = uniqueFile => {
  // Get original file extension
  const EXTENSION = path.parse(uniqueFile.originalname).ext;
  //generate UUID
  return uuidv4() + EXTENSION;
};

export const generateVideoNameWithOnlyExtensionProvided = (extension: string) => {
  //generate UUID
  return uuidv4() + '.' + extension;
};

export const deleteImageIfExists = async imageURL => {
  if (APP_CONFIG.SERVER === 'linode') {
    const imagePath = APP_CONFIG.IMAGE_LOCAL_PATH + `${imageURL}`;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } else {
    await deleteMediaFromGoogleCloud(imageURL);
  }
};

export const deleteMediaIfExists = async (images = [], videoURL = '') => {
  if (images.length) {
    await Promise.all(
      images.map(async imageURL => {
        if (APP_CONFIG.SERVER === 'linode') {
          // can eventually remove this when linode is fully removed
          const imagePath = APP_CONFIG.IMAGE_LOCAL_PATH + `${imageURL}`;
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } else {
          await deleteMediaFromGoogleCloud(imageURL);
        }
      }),
    );
  }
  if (videoURL) {
    await deleteMediaFromGoogleCloud(videoURL, 'video');
  }
};

/**
 * If imageURL is existing on object, checks to make sure it exists
 * if exists then returns a built image url.
 * @param objectWithImageURL
 * @return url of image, if none then returns null
 */
export const obtainImageURL = objectWithImageURL => {
  // if imageURL doesnt exist set to null
  const imageURL = objectWithImageURL.imageURL ? objectWithImageURL.imageURL : null;

  return obtainImage(imageURL);
};

/**
 * if exists then returns a built image url.
 * @param imageURL
 * @return url of image, if none then returns null
 */
export const obtainImage = imageURL => {
  if (imageURL) {
    // if imageURL is a full URL instead of a fileName, return it directly
    if (imageURL.startsWith('https://')) {
      return imageURL;
    } else {
      return APP_CONFIG.IMAGE_HOSTING_URL + `${imageURL}`;
    }
  }
  return imageURL;
};

/**
 * if exists then returns a built https:// url.
 * @param url
 * @return url of image, if none then returns null
 */
export const obtainUrlHTTPS = url => {
  if (url) {
    // if url is a full URL, with scheme instead of just a domain name, return it directly
    if (url.startsWith('https://')) {
      return url;
    } else {
      return 'https://' + `${url}`;
    }
  }
  return url;
};

export const buildURL = (url: string): string => {
  return url?.endsWith('/') ? url : `${url}/`;
};

/**
 * if exists then returns a built medi url.
 * @param mediaURL
 * @return url of media, if none then returns null
 */
export const obtainMedia = (mediaURL: string, type = 'image'): string => {
  if (mediaURL) {
    // if imageURL is a full URL instead of a fileName, return it directly
    if (mediaURL.startsWith('https://')) {
      return mediaURL;
    }
    return `${buildURL(type === 'image' ? APP_CONFIG.IMAGE_HOSTING_URL : APP_CONFIG.VIDEO_HOSTING_URL)}${mediaURL}`;
  }
  return mediaURL;
};

/**
 * Uploads image to google cloud
 * @param  {} buffer an image buffer from sharp
 * @param  {} fileName the image name
 */
const uploadMediaToGoogleCloud = async function (buffer, fileName, type = 'image') {
  return await new Promise((resolve, reject) => {
    const filePath = type === 'image' ? `${buildURL(APP_CONFIG.IMAGE_LOCAL_PATH)}${fileName}` : `${buildURL(APP_CONFIG.VIDEO_LOCAL_PATH)}${fileName}`;
    // Create a new blob in the bucket and upload the file data.
    const bucket = getBucket();
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream.on('error', err => {
      logger.error(`${ERRORS.UPLOAD}: ${filePath}. ${err}`);
      reject(err);
    });
    blobStream.on('finish', async () => {
      try {
        // Make the image public
        await bucket.file(filePath).makePublic();
      } catch (err) {
        logger.error(`${ERRORS.PUBLIC}: Uploaded media to Cloud Storage successfully: ${filePath}, but public access is denied!`);
        reject(err);
      }
      logger.info(`Uploaded media to Cloud Storage successfully: ${filePath}.`);

      // If video, notify Transcoding API
      if (type === 'video') {
        try {
          const uuid = path.parse(fileName).name;
          const [response] = await createTranscodingJob(filePath, `videos/${uuid}/`);
          logger.info(`Transcoding job created succesfully: ${response.name}`);
        } catch (err) {
          logger.error(`${ERRORS.TRANSCODING_JOB}: Could not create video transcoding job`);
          reject(err);
        }
      }
      resolve(true);
    });
    blobStream.end(buffer);
  });
};

/**
 * Deletes an image from google cloud
 * @param  {} fileName the image / video file name.
 */
const deleteMediaFromGoogleCloud = async function (fileName: string, type = 'image') {
  const filePath = type === 'image' ? `${buildURL(APP_CONFIG.IMAGE_LOCAL_PATH)}${fileName}` : `${buildURL(APP_CONFIG.VIDEO_LOCAL_PATH)}${fileName}`;
  try {
    const bucket = getBucket();
    await bucket.file(filePath).delete();
  } catch (error) {
    logger.error(`${ERRORS.DELETE}. Could not delete file: ${filePath} from bucket: ${APP_CONFIG.IMAGE_BUCKET}. ${error}`);
  }
};

/**
 * Saves image locally or uploads to Cloud Storage depending on environment
 * @param  {} buffer an image buffer from sharp
 * @param  {} fileName the image name
 */
export const saveMedia = async (buffer, fileName, type = 'image') => {
  return await new Promise(async (resolve, reject) => {
    try {
      // If server is linode, copy file locally using sharp. If not, upload to GCP.
      if (APP_CONFIG.SERVER === 'linode') {
        const media_path = type === 'image' ? `${APP_CONFIG.IMAGE_LOCAL_PATH}${fileName}` : `${APP_CONFIG.VIDEO_LOCAL_PATH}${fileName}`;
        if (type === 'image') {
          const data = await sharp(buffer);
          resolve(await data.toFile(path.resolve(media_path)));
        } else {
          resolve(await path.resolve(media_path));
        }
      } else {
        resolve(await uploadMediaToGoogleCloud(buffer, fileName, type));
      }
    } catch (error) {
      logger.error(`${ERRORS.SAVE}: ${error}`);
      reject(error);
    }
  });
};
