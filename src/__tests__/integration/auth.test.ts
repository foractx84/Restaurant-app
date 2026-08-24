import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { sendResetPasswordEmail } from '@utils/emailUtils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken } from '@/utils/generateToken';
import { ormConnection } from '@/utils/dbUtils';
import { ManagerEntity } from '@/entities/manager.entity';
import { ManagerRestaurantsEntity } from '@/entities/managerRestaurants.entity';
import ManagersModel from '@/models/managers.model';
import TitlesModel from '@/models/titles.model';
import { toTitleCase } from '@utils/util';
import { getCurrentDate } from '@utils/timeUtils';
import { v4 as uuidv4 } from 'uuid';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

// mock jwt.verify until a test token is generated
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
//mock authService response until Test DB creates proper tables for queries
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
    authenticateLogin: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService), generatePasswordHash: jest.fn((text: string) => text) }; // mock generatepasswordhash function to just return text no hashing being done
});
jest.mock('@/utils/emailUtils', () => {
  return {
    __esModule: true,
    sendResetPasswordEmail: jest.fn(),
  };
});
jest.mock('bcrypt', () => {
  const bcrypt = {
    compare: jest.fn(),
  };
  return { __esModule: true, default: bcrypt };
});
jest.mock('@/utils/generateToken', () => {
  return { __esModule: true, generateToken: jest.fn() };
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
jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});

const MOCK_TOKEN = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYW5hZ2VySUQiOjEwMDAsImlhdCI6MTY1MTQzNDYyMSwiZXhwIjoxODMxNDM0NjIxfQ.g_57QOVmJBTt3ouXpoP9HdlV_jYp761_fbabOvqVjXM999888777666555444333222111',
};

// Utility functions for generating unique test data
const generateUniqueEmail = (prefix = 'test'): string => {
  return `${prefix}-${Date.now()}-${uuidv4().substring(0, 8)}@test.com`;
};

const generateUniquePhone = (): string => {
  const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return randomDigits.toString();
};

const getTestEmail = (): string => {
  return generateUniqueEmail('auth-test');
};

const TEST_TEMP_PASSWORD = 'Old_password1$';

describe('auth API', () => {
  let testEmail: string;

  // ensure api is connected to database before starting
  beforeAll(async () => {
    await setUp();
    // Clean up any existing test managers before starting
    await cleanupTestManagers();
    // Ensure required titles exist
    await ensureTitlesExist();
  });

  // Clean up test data before each test and create fresh manager
  beforeEach(async () => {
    // Generate unique email for this test run
    testEmail = getTestEmail();
    // Clean up any existing test managers
    await cleanupTestManagers();
    // Create fresh test manager for auth tests
    await createTestManager(testEmail);
  });

  // clean up database and anything else done by tests
  afterAll(async () => {
    await cleanupTestManagers();
    await cleanUp();
  });

  describe('POST /forgotPassword', () => {
    it('should reset password for manager to temp password and return 200 status code', async () => {
      (sendResetPasswordEmail as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        email: testEmail,
      };

      await request(app.getServer()).post('/forgotPassword').send(req).expect(200);
    });
    it('should handle reset password for manager to temp password with case insenstive email and return 200 status code', async () => {
      (sendResetPasswordEmail as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        email: testEmail.charAt(0).toUpperCase() + testEmail.slice(1),
      };

      await request(app.getServer()).post('/forgotPassword').send(req).expect(200);
    });
    it('should throw 401 unauthorized user if email doesnt exist', async () => {
      const req = {
        email: 'john@DOESNOTEXIST987654321.com',
      };
      await request(app.getServer()).post('/forgotPassword').send(req).expect(401);
    });
  });
  describe('POST /resetPassword', () => {
    it('should reset password using temp password and updating to new, real password and return 200 status code', async () => {
      mockVerifyToken();
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'New_password1$',
      };

      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);

      const res = await request(app.getServer()).post('/resetPassword').send(req).expect(200);
      expect(res.body).toMatchObject(MOCK_TOKEN);
    });
    it('should reset password using temp password and updating to new, real password for case insenstive email and return 200 status code', async () => {
      mockVerifyToken();
      const req = {
        email: testEmail.charAt(0).toUpperCase() + testEmail.slice(1),
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'New_password1$',
      };

      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);

      const res = await request(app.getServer()).post('/resetPassword').send(req).expect(200);
      expect(res.body).toMatchObject(MOCK_TOKEN);
    });
    it('should throw 401 unauthorized user if email doesnt exist', async () => {
      const fakeEmail = generateUniqueEmail('nonexistent');
      const req = {
        email: fakeEmail,
        tempPassword: 'Old_password1$',
        newPassword: 'New_password1$',
      };
      await request(app.getServer()).post('/resetPassword').send(req).expect(401);
    });
    it('should throw 401 unauthorized user since password comparing validation fails', async () => {
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => false);
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'New_password1$',
      };
      await request(app.getServer()).post('/resetPassword').send(req).expect(401);
    });
    it('should throw 400 bad request if new password is invalid', async () => {
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'invalid',
      };

      await request(app.getServer()).post('/resetPassword').send(req).expect(400);
    });
    it('should throw 400 bad request if new password is missing a number', async () => {
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'NewPassword$',
      };
      await request(app.getServer()).post('/resetPassword').send(req).expect(400);
    });
    it('should throw 400 bad request if new password is missing a lowercase letter', async () => {
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'NEWPASSWORD1$',
      };

      await request(app.getServer()).post('/resetPassword').send(req).expect(400);
    });
    it('should throw 400 bad request if new password is missing an uppercase letter', async () => {
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'new_password1$',
      };

      await request(app.getServer()).post('/resetPassword').send(req).expect(400);
    });

    it('should throw 400 bad request if new password is missing a special character', async () => {
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'NewPassword1',
      };

      await request(app.getServer()).post('/resetPassword').send(req).expect(400);
    });

    it('should throw 400 bad request if new password is less than 9 characters', async () => {
      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'Short1$',
      };

      await request(app.getServer()).post('/resetPassword').send(req).expect(400);
    });
    it('should reset password with a new valid password and return 200 status code', async () => {
      mockVerifyToken();

      const req = {
        email: testEmail,
        tempPassword: TEST_TEMP_PASSWORD,
        newPassword: 'LoulouTapTab1$',
      };

      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);

      const res = await request(app.getServer()).post('/resetPassword').send(req).expect(200);

      expect(res.body).toMatchObject(MOCK_TOKEN);
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

const mockVerifyToken = (managerID?: number | 1) => {
  const decoded = {
    managerID: managerID,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (generateToken as jest.MockedFunction<any>).mockResolvedValueOnce(MOCK_TOKEN);
};

// Cleanup helper functions
const managerCleanupByEmail = async (email: string): Promise<void> => {
  try {
    const repository = await ormConnection();
    const manager = await repository.findOne(ManagerEntity, { where: { email: email.toLowerCase() } });
    if (manager?.id) {
      await repository.delete(ManagerRestaurantsEntity, { external_user_id: manager.id });
      await repository.delete(ManagerEntity, { id: manager.id });
    }
  } catch (err) {
    // Ignore errors - manager might not exist
  }
};

const managerCleanupByID = async (managerID: number): Promise<void> => {
  try {
    const repository = await ormConnection();
    await repository.delete(ManagerRestaurantsEntity, { external_user_id: managerID });
    await repository.delete(ManagerEntity, { id: managerID });
  } catch (err) {
    // Ignore errors - manager might not exist
  }
};

const cleanupTestManagers = async (): Promise<void> => {
  try {
    const repository = await ormConnection();
    const testManagers = await repository
      .createQueryBuilder(ManagerEntity, 'manager')
      .where("manager.email LIKE 'auth-test-%'")
      .orWhere("manager.email LIKE '%@test.com'")
      .getMany();

    const cleanupPromises = testManagers
      .filter(manager => manager.id)
      .map(manager =>
        managerCleanupByID(manager.id).catch(() => {
          // Ignore errors
        }),
      );
    await Promise.all(cleanupPromises);
  } catch (err) {
    // Ignore cleanup errors
  }
};

const ensureTitlesExist = async (): Promise<void> => {
  const titlesModel = new TitlesModel();
  const entityManager = await ormConnection();
  const requiredTitles = ['Owner', 'Manager'];

  const titlePromises = requiredTitles.map(async titleName => {
    try {
      const cleanTitleName = toTitleCase(titleName);
      const existingTitle = await titlesModel.getTitleByName(cleanTitleName, entityManager);
      if (!existingTitle) {
        await titlesModel.insertTitle(cleanTitleName, entityManager);
      }
    } catch (err) {
      // Title might already exist, ignore
    }
  });
  await Promise.all(titlePromises);
};

const createTestManager = async (email: string): Promise<void> => {
  try {
    const managersModel = new ManagersModel();
    const titlesModel = new TitlesModel();
    const entityManager = await ormConnection();

    const title = await titlesModel.getTitleByName('Manager', entityManager);
    if (!title) {
      throw new Error('Manager title not found');
    }

    const hashedPassword = TEST_TEMP_PASSWORD;
    const uniquePhone = generateUniquePhone();

    await entityManager.insert(ManagerEntity, {
      first_name: 'John',
      last_name: 'Smith',
      email: email.toLowerCase(),
      phone: uniquePhone,
      pwd: hashedPassword,
      position_title_id: title.titleID,
      verified_at: getCurrentDate(),
    });

    const createdManager = await entityManager.findOne(ManagerEntity, { where: { email: email.toLowerCase() } });

    if (createdManager?.id) {
      await managersModel.createManagerToRestaurantLink(
        {
          externalUserID: createdManager.id,
          restaurantID: 1,
        },
        entityManager,
      );
    }
  } catch (err) {
    // Manager might already exist, ignore
  }
};
