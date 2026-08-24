module.exports = {
  __esModule: true,
  APP_CONFIG: {
    IMAGE_BUCKET: 'dummy',
    VIDEO_LOCAL_PATH: 'videos/original/dummyPath',
  },
  default: {
    IMAGE_BUCKET: 'dummy',
    VIDEO_LOCAL_PATH: 'videos/original/dummyPath',
  },
  createSignedURLUtility: jest.fn(),
  checkFileExists: jest.fn(),
  createTranscodingJob: jest.fn(),
};
