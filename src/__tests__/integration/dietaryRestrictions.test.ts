import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';

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
// mock jwt.verify until a test token is generated
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
// mock authService response until Test DB creates proper tables for queries
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
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
const mockAuthService = new AuthService(new UsersModel());

describe('dietary restrictions API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('GET /restrictions', () => {
    it('should return all dietary restrictions', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const expectedResponse = [
        {
          restrictionID: expect.any(Number),
          name: 'Allium',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Beef',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Citrus',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Eggs',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Fish',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Gluten',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Gluten Free',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Gluten Free Available',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Lactose',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Mushroom',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Nuts',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Pork',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Poultry',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Shellfish',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Soy',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Spicy',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Vegan',
        },
        {
          restrictionID: expect.any(Number),
          name: 'Vegetarian',
        },
      ];
      const res = await request(app.getServer()).get('/restrictions').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      expect(res.body).toMatchObject(expectedResponse);
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

/**
 * bypass authorization layer
 */
const mockVerify = (managerID?: number | 1) => {
  const decoded = {
    managerID: managerID,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
};
