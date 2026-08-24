import { APP_CONFIG, GCP, MENU_ITEM_MEDIA } from '@configs/config';

// Imports the Transcoder library
const { TranscoderServiceClient } = require('@google-cloud/video-transcoder').v1;

// Instantiates a client
const transcoderServiceClient = new TranscoderServiceClient();

export async function createTranscodingJob(inputFilePath: String, outputFolderPath: String) {
  const request = {
    parent: transcoderServiceClient.locationPath(GCP.PROJECT_ID, GCP.LOCATION),
    job: {
      inputUri: `gs://${APP_CONFIG.IMAGE_BUCKET}/${inputFilePath}`,
      outputUri: `gs://${APP_CONFIG.IMAGE_BUCKET}/${outputFolderPath}`,
      templateId: MENU_ITEM_MEDIA.VIDEO_TRANSCODING_TEMPLATE,
    },
  };

  return transcoderServiceClient.createJob(request);
}
