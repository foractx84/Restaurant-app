import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { CreateTagResponseInterface, TagsInterface } from '@/interfaces/tags.interface';
import { ormConnection } from '@/utils/dbUtils';
import { TagsEntity } from '@/entities/tags.entity';
import { MenuItemsTagsEntity } from '@/entities/menuItemsTags.entity';

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

describe('tags API', () => {
  // Track created tags for cleanup
  const createdTagIDs: number[] = [];

  // ensure api is connected to database before starting
  beforeAll(async () => {
    await setUp();
    await cleanupTestTags();
  });

  // Clean up test data before each test to prevent duplicate key errors
  beforeEach(async () => {
    await cleanupTestTags();
  });

  // Clean up created tags after each test, even if it fails
  afterEach(async () => {
    for (const tagID of createdTagIDs) {
      try {
        await removeTag(tagID);
      } catch (err) {
        // Ignore cleanup errors to prevent masking test failures
      }
    }
    createdTagIDs.length = 0;
  });

  // clean up database and anything else done by tests
  afterAll(async () => {
    await cleanupTestTags();
    await cleanUp();
  });

  // Helper function to track tag for cleanup
  const trackTag = (tagID: number): void => {
    if (tagID && !createdTagIDs.includes(tagID)) {
      createdTagIDs.push(tagID);
    }
  };

  describe('POST /tags/restaurant', () => {
    const mReq = {
      name: 'test tag name',
      color: '#333fff',
    };
    it('should return created tag successfully', async () => {
      const expectedResponse: CreateTagResponseInterface = {
        tagID: expect.any(Number),
        name: 'test tag name',
        color: '#333fff',
      };
      mockVerify();
      const mRes = await request(app.getServer())
        .post('/tags/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq)
        .expect(200);
      expect(mRes.body).toEqual(expectedResponse);
      trackTag(mRes.body.tagID);
    });
    it('should return 409 resource conflict because there is already a tag with the same name and same color that is linked to restaurantID', async () => {
      // First create the tag (since beforeEach cleaned it up)
      mockVerify();
      const createRes = await request(app.getServer())
        .post('/tags/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq)
        .expect(200);
      trackTag(createRes.body.tagID);

      // Now try to create duplicate - should get 409
      const expectedResponse = {
        errors: [
          {
            code: 3336,
            message: expect.any(String),
          },
        ],
      };

      mockVerify();
      const mRes = await request(app.getServer())
        .post('/tags/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq)
        .expect(409);
      expect(mRes.body).toMatchObject(expectedResponse);
    });
    it('should return created tag with same name but different color successfully', async () => {
      const mReq2 = {
        name: 'test tag name',
        color: '#666fff',
      };
      const expectedResponse: CreateTagResponseInterface = {
        tagID: expect.any(Number),
        name: 'test tag name',
        color: '#666fff',
      };
      mockVerify();
      const mRes2 = await request(app.getServer())
        .post('/tags/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);
      expect(mRes2.body).toEqual(expectedResponse);
      trackTag(mRes2.body.tagID);
    });
    it('should return created tag with different name but same color successfully', async () => {
      const mReq3 = {
        name: 'test tag another name',
        color: '#333fff',
      };
      const expectedResponse: CreateTagResponseInterface = {
        tagID: expect.any(Number),
        name: 'test tag another name',
        color: '#333fff',
      };
      mockVerify();
      const mRes3 = await request(app.getServer())
        .post('/tags/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq3)
        .expect(200);
      expect(mRes3.body).toEqual(expectedResponse);
      trackTag(mRes3.body.tagID);
    });
    it('should return created tag with name and default color successfully', async () => {
      const mReq4 = {
        name: 'test tag with default color',
      };
      const expectedResponse: CreateTagResponseInterface = {
        tagID: expect.any(Number),
        name: 'test tag with default color',
        color: '#05944F',
      };
      mockVerify();
      const mRes4 = await request(app.getServer())
        .post('/tags/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq4)
        .expect(200);
      expect(mRes4.body).toEqual(expectedResponse);
      trackTag(mRes4.body.tagID);
    });
  });
  describe('GET /tags', () => {
    const validateTags = (tags: TagsInterface[]) => {
      tags.forEach(tag => {
        expect(tag.tagID).toBeTruthy();
        expect(tag.name).toBeTruthy();
      });

      const names = tags.map(tag => tag.name);
      const sortedNames = names.sort((a, b) => (a === b ? 0 : a < b ? -1 : 1));

      for (let i = 0; i < sortedNames.length; i++) {
        expect(sortedNames[i]).toEqual(names[i]);
      }
    };
    it('should return default tags and custom tags for restaurant provided', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const res = await request(app.getServer()).get('/tags').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      validateTags(res.body);
    });
    it('should return 5 default tags only when restaurant does not have any custom tag', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const res = await request(app.getServer()).get('/tags').set('Authorization', 'token').set('restaurantID', '6').expect(200);
      validateTags(res.body);
      expect(res.body.length).toEqual(5);
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

// Cleanup helper functions
const removeTag = async (tagID: number): Promise<void> => {
  try {
    const repository = await ormConnection();
    // Delete child records first (menu_items_tags)
    await repository.delete(MenuItemsTagsEntity, { tag_id: tagID });
    // Then delete the tag
    await repository.delete(TagsEntity, { tag_id: tagID });
  } catch (err) {
    // Ignore errors - tag might not exist
  }
};

const cleanupTestTags = async (): Promise<void> => {
  try {
    const repository = await ormConnection();
    // Clean up tags for test restaurants (1 and 6)
    const testTags = await repository
      .createQueryBuilder(TagsEntity, 'tag')
      .where('tag.restaurant_id IN (:...restaurantIDs)', { restaurantIDs: [1, 6] })
      .getMany();

    for (const tag of testTags) {
      if (tag.tag_id) {
        await removeTag(tag.tag_id);
      }
    }
  } catch (err) {
    // Ignore cleanup errors
  }
};
