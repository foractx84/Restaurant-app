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

describe('menuLayouts API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('PATCH /menuLayouts/restaurant', () => {
    const newMenuLayout = {
      layoutID: 4,
    };
    const originalMenuLayout = {
      layoutID: 2,
    };
    const menuLayoutDoesNotExit = {
      layoutID: 99999,
    };
    it('should update menu layout successfully for a restaurant', async () => {
      mockVerify();
      await request(app.getServer())
        .patch('/menuLayouts/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(newMenuLayout)
        .expect(200);

      // reset layout to original for next test
      mockVerify();
      await request(app.getServer())
        .patch('/menuLayouts/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(originalMenuLayout)
        .expect(200);
    });
    it('should return 200 if layout id in request is same as in the database', async () => {
      mockVerify();
      await request(app.getServer())
        .patch('/menuLayouts/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(originalMenuLayout)
        .expect(200);
    });
    it('should return 404 if layout id in request does not exist in the database', async () => {
      const expectedResponse = {
        errors: [
          {
            code: 2222,
            message: expect.any(String),
          },
        ],
      };

      mockVerify();
      const res = await request(app.getServer())
        .patch('/menuLayouts/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(menuLayoutDoesNotExit)
        .expect(404);
      expect(res.body).toEqual(expectedResponse);
    });
  });
  describe('GET /menuLayouts', () => {
    it('should return all menu layouts in database', async () => {
      const expectedResponse = {
        layouts: [
          {
            layoutID: 1,
            name: 'grid with text',
          },
          {
            layoutID: 2,
            name: 'grid no text',
          },
          {
            layoutID: 3,
            name: 'column with text',
          },
          {
            layoutID: 4,
            name: 'text only',
          },
          {
            layoutID: 5,
            name: 'grid with text dark',
          },
          {
            layoutID: 6,
            name: 'column with text dark',
          },
        ],
      };
      const res = await request(app.getServer()).get('/menuLayouts').expect(200);
      expect(res.body).toMatchObject(expectedResponse);
    });
  });
});

/**
 * set up database items needed for test cases
 * - connect to database
 */
const setUp = async () => {
  await getConnection().connect();
};
/**
 * clean up anything done by test cases
 * - close connections
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
