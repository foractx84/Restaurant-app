module.exports = {
  __esModule: true,
  APP_CONFIG: {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  },
  default: {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  },
  generateVideoNameWithOnlyExtensionProvided: jest.fn(),
  imageUpload: { fields: jest.fn() },
  obtainImage: jest.fn(),
  obtainMedia: jest.fn(),
  deleteMediaIfExists: jest.fn(),
  checkFileExists: jest.fn(),
  obtainUrlHTTPS: jest.fn(),
};
