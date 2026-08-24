import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import bcrypt from 'bcrypt';
import ManagersModel from '@/models/managers.model';
import { ormConnection } from '@/utils/dbUtils';
import { ManagerEntity } from '@/entities/manager.entity';
import { sendEmailOnboarding } from '@utils/emailUtils';
import { StripeCustomerEntity } from '@/entities/stripeCustomer.entity';
import TitlesModel from '@/models/titles.model';
import { toTitleCase } from '@utils/util';
import { ManagerRestaurantsEntity } from '@/entities/managerRestaurants.entity';
import { v4 as uuidv4 } from 'uuid';

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
    sign: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
// mock authService response until Test DB creates proper tables for queries
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateSuperUser: jest.fn(),
    validateManager: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService), generatePasswordHash: jest.fn((text: string) => text) }; // mock generatepasswordhash function to just return text no hashing being done
});
jest.mock('bcrypt', () => {
  const bcrypt = {
    compare: jest.fn(),
  };
  return { __esModule: true, default: bcrypt };
});
jest.mock('stripe', () => {
  const stripeMock = {
    customers: {
      update: jest.fn(),
    },
  };
  return { __esModule: true, default: jest.fn(() => stripeMock) };
});
jest.mock('@/utils/emailUtils', () => {
  return { __esModule: true, sendEmailOnboarding: jest.fn() };
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

// Utility functions for generating unique test data
const generateUniqueEmail = (prefix = 'test'): string => {
  return `${prefix}-${Date.now()}-${uuidv4().substring(0, 8)}@test.com`;
};

const generateUniquePhone = (): string => {
  const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return randomDigits.toString();
};

const generateUniqueStripeCustomerID = (): string => {
  return `stripe_customer_${Date.now()}_${uuidv4().substring(0, 8)}`;
};

describe('managers API', () => {
  // Track created managers for cleanup
  const createdManagerEmails: string[] = [];
  const createdManagerIDs: number[] = [];

  // ensure api is connected to database before starting
  beforeAll(async () => {
    await setUp();
    // Clean up any existing test managers before starting
    await cleanupTestManagers();
    // Ensure required titles exist before any tests run
    const titlesModel = new TitlesModel();
    const entityManager = await ormConnection();
    const requiredTitles = ['Owner', 'Manager'];
    for (const titleName of requiredTitles) {
      // Use toTitleCase to ensure case matches what service expects
      const cleanTitleName = toTitleCase(titleName);
      const existingTitle = await titlesModel.getTitleByName(cleanTitleName, entityManager);
      if (!existingTitle) {
        try {
          await titlesModel.insertTitle(cleanTitleName, entityManager);
        } catch (err) {
          // Title might already exist from concurrent test runs, ignore
        }
      }
    }
  });

  // Clean up test data before each test to prevent duplicate key errors
  beforeEach(async () => {
    await cleanupTestManagers();
    await cleanupStripeCustomers();
  });

  // Helper functions for tracking and cleanup
  const cleanupTrackedManagers = async (): Promise<void> => {
    const cleanupPromises = [
      ...createdManagerEmails.map(email =>
        managerCleanupByEmail(email).catch(() => {
          // Ignore errors
        }),
      ),
      ...createdManagerIDs.map(id =>
        managerCleanupByID(id).catch(() => {
          // Ignore errors
        }),
      ),
    ];
    await Promise.all(cleanupPromises);
    createdManagerEmails.length = 0;
    createdManagerIDs.length = 0;
  };

  // Clean up created managers after each test, even if it fails
  afterEach(async () => {
    await cleanupTrackedManagers();
  });

  // clean up database and anything else done by tests
  afterAll(async () => {
    await cleanupTrackedManagers();
    await cleanUp();
  });

  describe('POST /managers', () => {
    it('should create a manager using existing titleName', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith II',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'P@ssw0rd!',
        titleName: 'Owner',
        restaurantIDs: [1],
      };

      try {
        await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
        // Track for cleanup
        createdManagerEmails.push(req.email);
      } catch (err) {
        // Track for cleanup even on failure
        createdManagerEmails.push(req.email);
        throw err;
      }
    });
    it('should create a manager using default titleName', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'P@ssw0rd!',
        restaurantIDs: [1],
      };

      try {
        await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
        // Track for cleanup
        createdManagerEmails.push(req.email);
      } catch (err) {
        // Track for cleanup even on failure
        createdManagerEmails.push(req.email);
        throw err;
      }
    });
    it('should not create a manager if user is not special_users (super user)', async () => {
      failMockVerifySuperUser();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'P@ssw0rd!',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
    it('should not create a manager with invalid password', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith IV',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'invalidpassword',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should not create a manager with password that missing a number', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith IV',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'P@ssword!',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should not create a manager with password that missing a lowercase letter', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith IV',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'P@SSW0RD!',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should not create a manager with password that missing an uppercase letter', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith IV',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'p@ssw0rd!',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should not create a manager with password that missing a special character', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith IV',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'Password1',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should not create a manager with password that is less than 9 characters', async () => {
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith IV',
        email: generateUniqueEmail('manager'),
        phone: generateUniquePhone(),
        pwd: 'P@ssw0rd',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('POST /signUp', () => {
    it('should sign up manager with stripe customer id', async () => {
      const STRIPE_CUSTOMER_ID = generateUniqueStripeCustomerID();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('stripe'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
        stripeCustomerID: STRIPE_CUSTOMER_ID,
      };
      const mockToken = 'some string';
      (jwt.sign as jest.MockedFunction<any>).mockReturnValueOnce(mockToken);

      await createDummyManager(STRIPE_CUSTOMER_ID);
      try {
        const response = await request(app.getServer()).post('/signUp').send(req).expect(200);
        expect(response.body).toEqual(mockToken);
        // Track for cleanup
        createdManagerEmails.push(req.email);
      } finally {
        // Ensure cleanup runs even if test fails
        try {
          await managerCleanupByEmail(req.email);
          await deleteStripeCustomer(STRIPE_CUSTOMER_ID);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
    it('should throw 404 if manager does not exist with stripe customer id when provided', async () => {
      const STRIPE_CUSTOMER_ID = generateUniqueStripeCustomerID();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('onboarding'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
        stripeCustomerID: STRIPE_CUSTOMER_ID,
      };
      await request(app.getServer()).post('/signUp').send(req).expect(404);
    });
    it('should throw 409 if manager is already verified with stripe customer id when provided', async () => {
      const STRIPE_CUSTOMER_ID = generateUniqueStripeCustomerID();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('stripe'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
        stripeCustomerID: STRIPE_CUSTOMER_ID,
      };
      await createDummyManager(STRIPE_CUSTOMER_ID);
      try {
        await request(app.getServer()).post('/signUp').send(req).expect(200);
        await request(app.getServer()).post('/signUp').send(req).expect(409);
        // Track for cleanup
        createdManagerEmails.push(req.email);
      } finally {
        // Ensure cleanup runs even if test fails
        try {
          await managerCleanupByEmail(req.email);
          await deleteStripeCustomer(STRIPE_CUSTOMER_ID);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
    it('should create a manager for onboarding app flow using existing titleName', async () => {
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('onboarding'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      try {
        await request(app.getServer()).post('/signUp').send(req).expect(200);
        // Track for cleanup
        createdManagerEmails.push(req.email);
      } finally {
        // Ensure cleanup runs even if test fails
        try {
          await managerCleanupByEmail(req.email);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
    it('should throw 409 if email already exists for a manager when onboarding and manager is not verified', async () => {
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('onboarding'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };

      try {
        await request(app.getServer()).post('/signUp').send(req).expect(200);
        await request(app.getServer()).post('/signUp').send(req).expect(409);
        // Track for cleanup
        createdManagerEmails.push(req.email);
      } finally {
        // Ensure cleanup runs even if test fails
        try {
          await managerCleanupByEmail(req.email);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
    it('should throw 401 if email already exists for a manager when onboarding and manager is already verified', async () => {
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('onboarding'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };

      try {
        await request(app.getServer()).post('/signUp').send(req).expect(200);
        const managerModel = new ManagersModel();
        const CREATED_MANAGER = await managerModel.getManagerEntityByEmail(req.email);
        const manager = await ormConnection();
        await manager.update(ManagerEntity, CREATED_MANAGER.id, { verified_at: '2022-07-25T22:39:26.342Z' });

        await request(app.getServer()).post('/signUp').send(req).expect(401);
        // Track for cleanup
        createdManagerIDs.push(CREATED_MANAGER.id);
      } finally {
        // Ensure cleanup runs even if test fails
        try {
          await managerCleanupByEmail(req.email);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
    it('should not create a manager if password is invalid', async () => {
      failMockVerifySuperUser();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('signup'),
        phone: generateUniquePhone(),
        pwd: 'drowssap',
        titleName: 'Owner',
      };

      await request(app.getServer()).post('/signUp').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should not create a manager if position title is invalid', async () => {
      failMockVerifySuperUser();
      const req = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('signup'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Invalid Title',
      };

      await request(app.getServer()).post('/signUp').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /verify', () => {
    let reqCreateManager;
    beforeEach(() => {
      reqCreateManager = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('verify'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };
    });
    const mockToken = {
      token: 'some string',
      hasImageUpload: false,
      hasPairings: false,
    };
    it('should set verified_at to timestamp and also email_code to null for manager (200 status code response)', async () => {
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      // Track manager early for cleanup
      createdManagerEmails.push(reqCreateManager.email);
      try {
        await request(app.getServer()).post('/signUp').send(reqCreateManager).expect(200);
        const createdManager = await getManagerByEmail(reqCreateManager.email);
        const reqVerify = {
          managerID: createdManager.id,
          verificationCode: 'mockPassword',
        };
        (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
        (jwt.sign as jest.MockedFunction<any>).mockReturnValueOnce(mockToken);

        const result = await request(app.getServer()).put('/verify').send(reqVerify).expect(200);

        expect(result.body.token).toEqual(mockToken);
      } finally {
        // Ensure cleanup runs even if test fails
        try {
          await managerCleanupByEmail(reqCreateManager.email);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
    it('should throw 401 if manager does not exist by managerID', async () => {
      const reqVerify = {
        managerID: 999999,
        verificationCode: 'mockPassword',
      };

      await request(app.getServer()).put('/verify').send(reqVerify).expect(401);
    });
    it('should throw 401 if manager already verified', async () => {
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').send(reqCreateManager).expect(200);
      const createdManager = await getManagerByEmail(reqCreateManager.email);
      const reqVerify = {
        managerID: createdManager.id,
        verificationCode: 'mockPassword',
      };

      await request(app.getServer()).put('/verify').send(reqVerify).expect(200);
      await request(app.getServer()).put('/verify').send(reqVerify).expect(401);

      // cleanup
      await managerCleanupByEmail(reqCreateManager.email);
    });
    it('should throw 401 if verificationCode doesnt match email_code', async () => {
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').send(reqCreateManager).expect(200);
      const createdManager = await getManagerByEmail(reqCreateManager.email);
      const reqVerify = {
        managerID: createdManager.id,
        verificationCode: 'mockPassword',
      };
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => false);

      await request(app.getServer()).put('/verify').send(reqVerify).expect(401);

      // cleanup
      await managerCleanupByEmail(reqCreateManager.email);
    });
    it('should throw 401 if email code is null for manager', async () => {
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').send(reqCreateManager).expect(200);
      const createdManager = await getManagerByEmail(reqCreateManager.email);
      const reqVerify = {
        managerID: createdManager.id,
        verificationCode: 'mockPassword',
      };
      await setEmailCodeToNullManagerByID(createdManager.id);

      await request(app.getServer()).put('/verify').send(reqVerify).expect(401);

      // cleanup
      await managerCleanupByEmail(createdManager.email);
    });
  });
  describe('PUT /managers/password', () => {
    let MANAGER_ID;
    it('should update a managers password', async () => {
      // Create manager first since cleanup runs before each test
      mockVerify();
      const createReq = {
        firstName: 'John',
        lastName: 'Smith Password',
        email: generateUniqueEmail('password'),
        phone: generateUniquePhone(),
        pwd: 'P@ssw0rd!',
        restaurantIDs: [1],
      };
      await request(app.getServer()).post('/managers').set('Authorization', 'token').set('restaurantID', '1').send(createReq).expect(200);
      createdManagerEmails.push(createReq.email);

      const managerModel = new ManagersModel();
      const manager = await managerModel.getManagerEntityByEmail(createReq.email);
      const { id: managerID, pwd } = manager;
      MANAGER_ID = managerID;
      mockVerify(MANAGER_ID);
      const req = {
        currentPassword: pwd,
        newPassword: 'New_password3!',
      };
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);

      await request(app.getServer()).put('/managers/password').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 400 HttpExceptions error since new password is invalid', async () => {
      mockVerify(MANAGER_ID);
      const req = {
        currentPassword: 'New_password3!',
        newPassword: 'new_password',
      };
      await request(app.getServer()).put('/managers/password').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 401 HttpExceptions error since current password does not match old password', async () => {
      mockVerify(MANAGER_ID);
      const req = {
        currentPassword: 'Wrong_password3!',
        newPassword: 'New_password4!',
      };
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => false);

      await request(app.getServer()).put('/managers/password').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
  });
  describe('PUT /resendEmail', () => {
    let reqCreateManager;
    beforeEach(() => {
      reqCreateManager = {
        firstName: 'John',
        lastName: 'Smith III',
        email: generateUniqueEmail('resend'),
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };
    });
    it('should update email_code to hashed value for manager (200 status code response)', async () => {
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').send(reqCreateManager).expect(200);
      const createdManager = await getManagerByEmail(reqCreateManager.email);
      const reqResendEmail = {
        email: createdManager.email,
      };

      // email code is hashed
      const oldEmailCode = createdManager.email_code;
      expect(createdManager.email_code).toBeTruthy();

      await request(app.getServer()).post('/resendEmail').send(reqResendEmail).expect(200);

      const emailCodeUpdatedManager = await getManagerByEmail(reqCreateManager.email);

      // email code is changed to different hash
      const newEmailCode = emailCodeUpdatedManager.email_code;
      expect(emailCodeUpdatedManager.email_code).toBeTruthy();

      // compare both email codes
      expect(oldEmailCode).not.toEqual(newEmailCode);

      // cleanup
      await managerCleanupByEmail(reqCreateManager.email);
    });
    it('should not update email_code for manager that already is verified (200 status code response)', async () => {
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').send(reqCreateManager).expect(200);
      const createdManager = await getManagerByEmail(reqCreateManager.email);
      const reqResendEmail = {
        email: reqCreateManager.email,
      };
      const reqVerify = {
        managerID: createdManager.id,
        verificationCode: 'mockPassword',
      };
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      await request(app.getServer()).put('/verify').send(reqVerify).expect(200);

      const verifiedManager = await getManagerByEmail(reqCreateManager.email);
      // get the original code
      const verifiedManagerEmailCode = verifiedManager.email_code;

      await request(app.getServer()).post('/resendEmail').send(reqResendEmail).expect(200);

      const resentEmailManager = await getManagerByEmail(reqCreateManager.email);
      // check if email code has not changed
      expect(resentEmailManager.email_code).toEqual(verifiedManagerEmailCode);

      // cleanup
      await managerCleanupByEmail(reqCreateManager.email);
    });
    it('should throw 401 for email of manager that doesnt exist', async () => {
      const reqResendEmail = {
        email: generateUniqueEmail('nonexistent'),
      };

      await request(app.getServer()).post('/resendEmail').send(reqResendEmail).expect(401);
    });
  });
  describe('GET /manager', () => {
    const expectedResponse = {
      firstName: 'Manager',
      lastName: 'Test',
      email: 'manager.test@taptab.com',
      phone: '8881231234',
      title: {
        titleID: 6,
        name: 'Manager',
      },
    };
    it('should get manager info and title of manager via authorization token embedded managerID (status code 200)', async () => {
      mockVerify(999);
      const result = await request(app.getServer()).get('/manager').set('Authorization', 'token').expect(200);

      expect(result.body).toEqual(expectedResponse);
    });
    it('should throw 404 if manager does not exist via managerID', async () => {
      mockVerify(9999);
      await request(app.getServer()).get('/manager').set('Authorization', 'token').expect(404);
    });
  });
  describe('PUT /manager', () => {
    it('should edit manager info via authorization token embedded managerID (status code 200)', async () => {
      // create account
      const originalEmail = generateUniqueEmail('edit');
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith',
        email: originalEmail,
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const createdManager = await getManagerByEmail(originalEmail);
      createdManagerEmails.push(originalEmail);

      // edit manager info
      const editRequest = {
        lastName: 'John',
        firstName: 'Smith',
        email: generateUniqueEmail('edited'),
        phone: generateUniquePhone(),
      };
      mockVerify(createdManager.id);
      await request(app.getServer()).put('/manager').set('Authorization', 'token').send(editRequest).expect(200);

      // clean up
      await managerCleanupByID(createdManager.id);
    });
    it('should edit all manager info except email via authorization token embedded managerID (status code 200)', async () => {
      // create account
      const originalEmail = generateUniqueEmail('edit');
      mockVerify();
      const req = {
        firstName: 'John',
        lastName: 'Smith',
        email: originalEmail,
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const createdManager = await getManagerByEmail(originalEmail);
      createdManagerEmails.push(originalEmail);

      // edit manager info
      const editRequest = {
        lastName: 'Paul',
        firstName: 'Jenkins',
        email: originalEmail,
        phone: generateUniquePhone(),
      };
      mockVerify(createdManager.id);
      await request(app.getServer()).put('/manager').set('Authorization', 'token').send(editRequest).expect(200);

      // clean up
      await managerCleanupByID(createdManager.id);
    });
    it('should throw 409 resource conflict if the input email already exists for another manager', async () => {
      // signup for manager1
      const originalEmail = generateUniqueEmail('manager1');
      mockVerify();
      const signUpRequest1 = {
        firstName: 'John',
        lastName: 'Smith',
        email: originalEmail,
        phone: generateUniquePhone(),
        pwd: 'Password1!',
        titleName: 'Owner',
      };
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').set('Authorization', 'token').set('restaurantID', '1').send(signUpRequest1).expect(200);
      const createdManager1 = await getManagerByEmail(originalEmail);
      createdManagerEmails.push(originalEmail);

      // signup for manager2
      const emailBelongsToManager2 = generateUniqueEmail('manager2');
      const signUpRequest2 = {
        firstName: 'John',
        lastName: 'Lee',
        email: emailBelongsToManager2,
        phone: generateUniquePhone(),
        pwd: 'Password222!',
        titleName: 'Owner',
      };
      (sendEmailOnboarding as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).post('/signUp').set('Authorization', 'token').set('restaurantID', '6').send(signUpRequest2).expect(200);
      const createdManager2 = await getManagerByEmail(emailBelongsToManager2);
      createdManagerEmails.push(emailBelongsToManager2);

      // edit manager1 info
      const editRequest = {
        lastName: 'John',
        firstName: 'Smith',
        email: emailBelongsToManager2,
        phone: '1112220000',
      };
      const expectedResponse = {
        errors: [
          {
            code: 3336,
            message: expect.any(String),
          },
        ],
      };
      mockVerify(createdManager1.id);
      const mRes = await request(app.getServer()).put('/manager').set('Authorization', 'token').send(editRequest).expect(409);
      expect(mRes.body).toEqual(expectedResponse);

      // clean up
      await managerCleanupByID(createdManager1.id);
      await managerCleanupByID(createdManager2.id);
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
    superUser: true,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (mockAuthService.validateSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(true);
};
const failMockVerifySuperUser = (managerID?: number | 1) => {
  const decoded = {
    managerID: managerID,
    superUser: false,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
};

const createDummyManager = async (stripeCustomerID: string) => {
  const repository = await ormConnection();
  const uniqueEmail = generateUniqueEmail('dummy');

  try {
    await repository.insert(StripeCustomerEntity, {
      stripe_customer_id: stripeCustomerID,
    });
  } catch (err) {
    // Stripe customer might already exist, ignore
  }

  try {
    await repository.insert(ManagerEntity, {
      email: uniqueEmail,
      position_title_id: 6,
      stripe_customer_id: stripeCustomerID,
    });
  } catch (err) {
    // Manager might already exist, ignore
  }
};

const getManagerByEmail = async email => {
  const managerModel = new ManagersModel();
  return await managerModel.getManagerEntityByEmail(email);
};
// Cleanup function that removes manager and all related data
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

// Cleanup helper functions
const cleanupTestManagers = async (): Promise<void> => {
  try {
    const repository = await ormConnection();
    const testManagers = await repository
      .createQueryBuilder(ManagerEntity, 'manager')
      .where("manager.email LIKE '%@test.com'")
      .orWhere("manager.email LIKE '%-%'")
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

const deleteStripeCustomer = async (stripeCustomerID: string): Promise<void> => {
  try {
    const repository = await ormConnection();
    await repository.delete(StripeCustomerEntity, {
      stripe_customer_id: stripeCustomerID,
    });
  } catch (err) {
    // Ignore cleanup errors
  }
};

const cleanupStripeCustomers = async (): Promise<void> => {
  try {
    const repository = await ormConnection();
    const testStripeCustomers = await repository
      .createQueryBuilder(StripeCustomerEntity, 'stripe')
      .where("stripe.stripe_customer_id LIKE 'stripe_customer_%'")
      .getMany();

    const cleanupPromises = testStripeCustomers.map(customer =>
      repository
        .delete(StripeCustomerEntity, {
          stripe_customer_id: customer.stripe_customer_id,
        })
        .catch(() => {
          // Ignore errors
        }),
    );
    await Promise.all(cleanupPromises);
  } catch (err) {
    // Ignore cleanup errors
  }
};
const setEmailCodeToNullManagerByID = async managerID => {
  const manager = await ormConnection();
  return await manager.update(ManagerEntity, managerID, { email_code: null });
};
