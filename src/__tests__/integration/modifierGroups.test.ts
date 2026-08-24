import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { CreateModifierRequestInterface } from '@interfaces/modifier.interface';
import { ormConnection } from '@utils/dbUtils';
import {
  CreateModifierGroupRequestInterface,
  CreateModifierGroupResponseInterface,
  EditModifierGroupRequestInterface,
  GetModifierGroupResponseInterface,
} from '@/interfaces/modifierGroup.interface';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { ModifierToModifierGroupLinkEntity } from '@/entities/modifierToModiferGroupLink.entity';

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
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'https://dummy_image.jpeg',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  const originalModule = jest.requireActual('@/configs/config');

  return {
    __esModule: true,
    ...originalModule,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});
jest.mock('@/utils/imageUtils', () => {
  const originalModule = jest.requireActual('@/utils/imageUtils');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
    imageUpload: { fields: jest.fn() },
  };
});

const mockAuthService = new AuthService(new UsersModel());
let MODIFIER_ID: number;
describe('modifierGroups API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());

  // set up modifier before each test
  beforeEach(async () => await setUpModifier());

  /**
   * set up database items needed for test cases
   */
  const setUpModifier = async () => {
    const createModifierReq: CreateModifierRequestInterface = {
      name: 'Test_MODIFIER',
      price: 100,
      description: 'Blah',
    };
    mockVerify();
    const mRes = await request(app.getServer())
      .post('/modifier')
      .set('Authorization', 'token')
      .set('restaurantID', '1')
      .send(createModifierReq)
      .expect(200);
    MODIFIER_ID = mRes.body.modifierID;
  };

  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('POST /modifierGroup', () => {
    it('should create modifier group successfully', async () => {
      const req = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [MODIFIER_ID],
      };
      mockVerify();
      const mRes = await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      assertCreateModifierGroupResponse(mRes.body);

      // cleanup
      await removeModifierGroup(mRes.body.modifierGroupID);
    });
    it('should throw 401 if restaurant does not contain the provided modifierID', async () => {
      const req = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [99999],
      };
      mockVerify();
      await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
    it('should throw 401 if restaurant contains only some of the provided modifierIDs in the request', async () => {
      const req = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [MODIFIER_ID, 999999],
      };
      mockVerify();
      await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
    it('should throw 409 if restaurant already has a modifier group with the same name', async () => {
      const req = {
        name: 'TEST_NAME_2',
        label: 'TEST_LABEL_2',
        modifierIDs: [MODIFIER_ID],
      };
      mockVerify();
      const mRes = await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      mockVerify();
      await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(409);

      // cleanup
      await removeModifierGroup(mRes.body.modifierGroupID);
    });
  });
  describe('PUT /modifierGroup', () => {
    it.each([
      [
        'update all values',
        { name: 'update all values', label: 'This is a test', modifierIDs: [MODIFIER_ID] },
        { modifierGroupID: 1, name: 'values have been updated', label: 'This label has too' },
      ],
      [
        'update name value',
        { name: 'update all values', label: 'This is a test', modifierIDs: [MODIFIER_ID] },
        { modifierGroupID: 1, name: 'edited name' },
      ],
      [
        'update label value',
        { name: 'update label value', label: 'This is a test', modifierIDs: [MODIFIER_ID] },
        { modifierGroupID: 1, label: 'This has been updated' },
      ],
    ])(
      'should %s for modifier group successfully',
      async (name: string, createReq: CreateModifierGroupRequestInterface, editReq: EditModifierGroupRequestInterface) => {
        mockVerify();

        createReq.modifierIDs = [MODIFIER_ID];
        const cRes = await request(app.getServer())
          .post('/modifierGroup')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(createReq)
          .expect(200);

        const modifierGroupID = cRes.body.modifierGroupID;
        editReq.modifierGroupID = modifierGroupID;

        mockVerify();
        await request(app.getServer()).put('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);

        // cleanup
        await removeModifierGroup(modifierGroupID);
      },
    );
    it('should throw 404 No Content if provided modifier group id does not exist', async () => {
      const req = { modifierGroupID: 9999, name: 'edited name' };
      mockVerify();
      await request(app.getServer()).put('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(404);
    });
    it('should throw 409 Duplicate Content if restaurant already has a modifier group with the same name when editing modifier group', async () => {
      const req1: CreateModifierGroupRequestInterface = {
        name: 'TEST_NAME_1',
        label: 'TEST_LABEL_1',
        modifierIDs: [MODIFIER_ID],
      };
      const req2: CreateModifierGroupRequestInterface = {
        name: 'TEST_NAME_2',
        label: 'TEST_LABEL_2',
        modifierIDs: [MODIFIER_ID],
      };
      const editReq: EditModifierGroupRequestInterface = {
        modifierGroupID: 1,
        name: 'TEST_NAME_1',
        label: 'TEST_LABEL_2',
      };
      mockVerify();
      const cRes1 = await request(app.getServer())
        .post('/modifierGroup')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      mockVerify();
      const cRes2 = await request(app.getServer())
        .post('/modifierGroup')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);
      mockVerify();

      editReq.modifierGroupID = cRes2.body.modifierGroupID;
      await request(app.getServer()).put('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(409);

      await removeModifierGroup(cRes1.body.modifierGroupID);
      await removeModifierGroup(cRes2.body.modifierGroupID);
    });
  });
  describe('DELETE /modifierGroup', () => {
    it('should successfully soft delete modifier group', async () => {
      mockVerify();

      const createReq: CreateModifierGroupRequestInterface = { name: 'update all values', label: 'This is a test', modifierIDs: [MODIFIER_ID] };
      const cRes = await request(app.getServer())
        .post('/modifierGroup')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createReq)
        .expect(200);

      const modifierGroupID = cRes.body.modifierGroupID;

      mockVerify();
      await request(app.getServer()).delete(`/modifierGroup/${modifierGroupID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);

      // cleanup
      await removeModifierGroup(modifierGroupID);
    });
  });
  describe('PUT /modifierGroup/modifiers', () => {
    it('should successfully link modifiers to modifier group', async () => {
      const req = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [MODIFIER_ID],
      };
      mockVerify();
      const mGRes = await request(app.getServer())
        .post('/modifierGroup')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);

      const modifierGroupID = mGRes.body.modifierGroupID;

      const createModifierReq: CreateModifierRequestInterface = {
        name: 'Test_MODIFIER',
        price: 100,
        description: 'Blah',
      };
      mockVerify();
      const mRes = await request(app.getServer())
        .post('/modifier')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createModifierReq)
        .expect(200);
      const modifierID = mRes.body.modifierID;

      mockVerify();
      await request(app.getServer())
        .put('/modifierGroup/modifiers')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ modifierGroupID, modifierIDs: [modifierID] })
        .expect(200);

      await removeModifierGroup(modifierGroupID);
    });
    it('should throw 401 if restaurant does not contain the provided modifierID when linking modifiers to modifier group', async () => {
      const req = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [MODIFIER_ID],
      };
      mockVerify();
      const mRes = await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      const modifierGroupID = mRes.body.modifierGroupID;

      mockVerify();
      await request(app.getServer())
        .put('/modifierGroup/modifiers')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ modifierGroupID, modifierIDs: [99999] })
        .expect(401);

      await removeModifierGroup(modifierGroupID);
    });
    it('should throw 401 if modifier exists for different restaurant when linking modifiers to modifier group', async () => {
      const req = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [MODIFIER_ID],
      };
      mockVerify();
      const mRes = await request(app.getServer()).post('/modifierGroup').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      const modifierGroupID = mRes.body.modifierGroupID;

      mockVerify();
      await request(app.getServer())
        .put('/modifierGroup/modifiers')
        .set('Authorization', 'token')
        .set('restaurantID', '6')
        .send({ modifierGroupID, modifierIDs: [MODIFIER_ID] })
        .expect(401);

      await removeModifierGroup(modifierGroupID);
    });
  });
  describe('GET /modifierGroups', () => {
    const assertModifierResponse = (response: GetModifierGroupResponseInterface) => {
      expect(typeof response.modifierGroupID).toEqual('number');
      expect(typeof response.name).toEqual('string');
      expect(typeof response.label).toEqual('string');
      response.modifiers.forEach(modifier => {
        expect(typeof modifier.modifierID).toEqual('number');
        expect(typeof modifier.description).toEqual('string');
        expect(typeof modifier.imageURL).toEqual('string');
        expect(typeof modifier.isHidden).toEqual('boolean');
        expect(typeof modifier.name).toEqual('string');
        expect(typeof modifier.price).toEqual('number');
      });
    };
    it('should return all modifier groups for restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer()).get('/modifierGroups').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      const modifierGroups = res.body as GetModifierGroupResponseInterface[];
      modifierGroups.forEach((group: GetModifierGroupResponseInterface) => assertModifierResponse(group));
    });
  });
});

/**
 * verify actual response matches expected response
 */
const assertCreateModifierGroupResponse = (response: CreateModifierGroupResponseInterface) => {
  const expectedResponse = {
    modifierGroupID: expect.any(Number),
    name: expect.any(String),
    label: expect.any(String),
    modifiers: response.modifiers.map(() => ({
      modifierID: expect.any(Number),
      name: expect.any(String),
      description: expect.any(String),
      price: expect.any(Number),
      imageURL: expect.any(String),
      isHidden: expect.any(Boolean),
    })),
  };
  expect(response).toMatchObject(expectedResponse);
};

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

const removeModifierGroup = async (modifierGroupID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(ModifierToModifierGroupLinkEntity, { modifierGroupID });
  await repository.delete(ModifierGroupEntity, modifierGroupID);
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
