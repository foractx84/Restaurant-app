import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { CuisineInterface } from '@interfaces/cuisines.interface';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

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
jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});

describe('cuisines API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('GET /cuisines', () => {
    const validateCuisines = (cuisines: CuisineInterface[]) => {
      cuisines.forEach(cuisine => {
        expect(cuisine.cuisineID).toBeTruthy();
        expect(cuisine.name).toBeTruthy();
      });

      const names = cuisines.map(cuisine => cuisine.name);
      const sortedNames = names.sort((a, b) => (a === b ? 0 : a < b ? -1 : 1));

      for (let i = 0; i < sortedNames.length; i++) {
        expect(sortedNames[i]).toEqual(names[i]);
      }
    };
    it('should return all cuisines in alphabetical order', async () => {
      const res = await request(app.getServer()).get('/cuisines').expect(200);
      validateCuisines(res.body);
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
