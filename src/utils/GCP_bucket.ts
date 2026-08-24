import { APP_CONFIG } from '@/configs/config';
import { Bucket, GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import { logger } from './logger';

// Instantiate a storage client with Application Default Credentials
const storage = new Storage();

let _bucket: Bucket | null = null;

export const getBucket = (): Bucket => {
  if (!_bucket) {
    _bucket = storage.bucket(APP_CONFIG.IMAGE_BUCKET);
  }
  return _bucket;
};

/**
 * Generates a v4 signed URL for reading a blob.
 * @param {string} bucketName The bucket name.
 * @param {string} fileName The file name.
 * @param {number} [expires=60] Expiration time in minutes.
 * @returns {Promise<string>} The signed URL.
 */
export const createSignedURLUtility = async (bucketName, fileName, expires = 60) => {
  const options: GetSignedUrlConfig = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + expires * 60 * 1000, // Expires in specified number of minutes
  };

  try {
    const [url] = await storage.bucket(bucketName).file(`${APP_CONFIG.VIDEO_LOCAL_PATH}/${fileName}`).getSignedUrl(options);
    return url;
  } catch (error) {
    logger.error(`Error generating signed URL`, error);
    throw error;
  }
};

/**
 * Checks if a file exists on cloud storage based on bucket and file path location
 * @param {string} bucketName The bucket name.
 * @param {string} fileName The file name.
 * @returns {Promise<Boolean>} boolean value based on file existing on cloud storage.
 */
export const checkFileExists = async (bucketName: string, fileName: string): Promise<Boolean> => {
  const file = storage.bucket(bucketName).file(fileName);

  try {
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    logger.error('Error occurred while checking file existence:', error);
    throw error;
  }
};
