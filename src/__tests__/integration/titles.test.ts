import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { GetTitlesResponseInterface } from '@interfaces/titles.interface';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    imageUpload: { fields: jest.fn() },
  };
});

describe('titles API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('GET /titles', () => {
    it('should get titles', async () => {
      const validateTitleResponse = (response: GetTitlesResponseInterface) => {
        response.titles.forEach(title => {
          expect(title).toMatchObject({
            titleID: expect.any(Number),
            name: expect.any(String),
          });
        });
      };
      const res = await request(app.getServer()).get('/titles').expect(200);
      validateTitleResponse(res.body);
    });
  });
});

/**
 * set up database items needed for test cases
 *  - connect to database
 */
const setUp = async () => {
  await getConnection().connect();
};
/**
 * clean up anything done by test cases
 *  - close connections
 */
const cleanUp = async () => {
  await getConnection().close();
};
