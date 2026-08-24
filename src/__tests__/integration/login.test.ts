import { ManagerEntity } from '@/entities/manager.entity';
import ManagersModel from '@/models/managers.model';
import { app } from '@/server';
import { ormConnection } from '@/utils/dbUtils';
import { sendEmailOnboarding } from '@utils/emailUtils';
import request from 'supertest';
import { getConnection } from 'typeorm';

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
jest.mock('@/utils/emailUtils', () => {
  return { __esModule: true, sendEmailOnboarding: jest.fn() };
});
jest.mock('jsonwebtoken', () => {
  const jwt = {
    sign: jest.fn(),
  };
  return { __esModule: true, default: jwt };
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

describe('login integration tests', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('POST /login', () => {
    const REAL_MANAGER_EMAIL = 'manager.test@taptab.com';
    const REAL_MANAGER_EMAIL_In_CAPS = 'MANAGER.TEST@TAPTAB.COM';
    const REAL_ADMIN_EMAIL = 'admin.test@taptab.com';
    const FAKE_EMAIL = 'john@DOESNOTEXIST987654321.com';
    it('should login regular manager user', async () => {
      const req = {
        email: REAL_MANAGER_EMAIL,
        password: 'Test123!$',
      };

      await request(app.getServer()).post('/login').send(req).expect(200);
    });
    it('should login regular manager user with email in caps', async () => {
      const req = {
        email: REAL_MANAGER_EMAIL_In_CAPS,
        password: 'Test123!$',
      };

      await request(app.getServer()).post('/login').send(req).expect(200);
    });
    it('should login regular manager user with email that has some lower case and some upper case letters (case insensitive check)', async () => {
      const req = {
        email: 'mAnagEr.teSt@Taptab.coM',
        password: 'Test123!$',
      };

      await request(app.getServer()).post('/login').send(req).expect(200);
    });
    it('should login super user', async () => {
      const req = {
        email: REAL_ADMIN_EMAIL,
        password: 'Test123!$',
      };
      await request(app.getServer()).post('/login').send(req).expect(200);
    });
    it('should throw 401 unauthorized user if user doesnt exist based on email', async () => {
      const req = {
        email: FAKE_EMAIL,
        password: 'New_password1$',
      };

      await request(app.getServer()).post('/login').send(req).expect(401);
    });
    it('should throw 401 unauthorized user since password comparing validation fails', async () => {
      const req = {
        email: REAL_MANAGER_EMAIL,
        password: 'Wrong_password123$',
      };

      await request(app.getServer()).post('/login').send(req).expect(401);
    });
    it('should throw 412 error if manager is not verified', async () => {
      const reqSignUp = {
        firstName: 'John',
        lastName: 'Smith III',
        email: 'johnSmithOnboardingLogin@email.com',
        phone: '2025550178',
        pwd: 'Password1!',
        titleName: 'Owner',
      };
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      // create manager (default -> unverified)
      await request(app.getServer()).post('/signUp').set('restaurantID', '1').send(reqSignUp).expect(200);

      const req = {
        email: reqSignUp.email,
        password: 'Password1!',
      };

      await request(app.getServer()).post('/login').send(req).expect(412);

      // cleanup
      await managerCleanupByEmail(reqSignUp.email);
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

const getManagerByEmail = async email => {
  const managerModel = new ManagersModel();
  return await managerModel.getManagerEntityByEmail(email);
};
const managerCleanupByEmail = async email => {
  const CREATED_MANAGER = await getManagerByEmail(email);
  const manager = await ormConnection();
  await manager.delete(ManagerEntity, { id: CREATED_MANAGER.id });
};
