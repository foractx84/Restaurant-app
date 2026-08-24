import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { CreateModifierRequestInterface, ModifierResponse, EditModifierRequestInterface } from '@interfaces/modifier.interface';
import { ormConnection } from '@utils/dbUtils';
import { ModifierEntity } from '@/entities/modifier.entity';

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

describe('modifiers API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('GET /modifiers', () => {
    const assertModifierResponse = (response: ModifierResponse) => {
      expect(typeof response.modifierID).toEqual('number');
      expect(typeof response.name).toEqual('string');
      expect(typeof response.price).toEqual('number');
      expect(typeof response.description).toEqual('string');
      expect(typeof response.isHidden).toEqual('boolean');
      expect(typeof response.imageURL).toEqual('string');
    };
    it('should return all modifiers for restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer()).get('/modifiers').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      const modifiers = res.body as ModifierResponse[];
      modifiers.forEach((modifier: ModifierResponse) => assertModifierResponse(modifier));
    });
  });
  describe('POST /modifier', () => {
    it.each([
      [
        'with all values',
        { name: 'with all values', description: 'This is a test', price: 100 },
        { modifierID: expect.any(Number), name: 'with all values', description: 'This is a test', price: 100, isHidden: false, imageURL: '' },
      ],
      [
        'with minimum values',
        { name: 'with minimum values', description: '', price: 0 },
        { modifierID: expect.any(Number), name: 'with minimum values', description: '', price: 0, isHidden: false, imageURL: '' },
      ],
      [
        'with missing values',
        { name: 'with missing values' },
        { modifierID: expect.any(Number), name: 'with missing values', description: '', price: 0, isHidden: false, imageURL: '' },
      ],
    ])('should create modifier %s successfully', async (name: string, req: CreateModifierRequestInterface, res: ModifierResponse) => {
      mockVerify();
      const mRes = await request(app.getServer()).post('/modifier').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(mRes.body).toEqual(res);
      await removeModifier(mRes.body.modifierID);
    });
  });
  describe('PUT /modifier', () => {
    it.each([
      [
        'update all values',
        { name: 'update all values', description: 'This is a test', price: 100 },
        { modifierID: 1, name: 'values have been updated', description: 'This description has too', price: 1000 },
      ],
      ['update name value', { name: 'update all values', description: 'This is a test', price: 100 }, { modifierID: 1, name: 'edited name' }],
      [
        'update description value',
        { name: 'update description value', description: 'This is a test', price: 100 },
        { modifierID: 1, description: 'This has been updated' },
      ],
      [
        'update description value to an empty string',
        { name: 'update description value to an empty string', description: 'This is a test', price: 100 },
        { modifierID: 1, description: '' },
      ],
      ['update price value', { name: 'update price value', description: 'This is a test', price: 100 }, { modifierID: 1, price: 1000 }],
      ['update price value to 0', { name: 'update price value to 0', description: 'This is a test', price: 100 }, { modifierID: 1, price: 0 }],
    ])(
      'should %s for modifier successfully',
      async (name: string, createReq: CreateModifierRequestInterface, editReq: EditModifierRequestInterface) => {
        mockVerify();

        const cRes = await request(app.getServer())
          .post('/modifier')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(createReq)
          .expect(200);

        const modifierID = cRes.body.modifierID;

        editReq.modifierID = modifierID;
        mockVerify();
        await request(app.getServer()).put('/modifier').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);

        await removeModifier(modifierID);
      },
    );
  });
  describe('DELETE /modifiers', () => {
    it('should successfully soft delete modifier ', async () => {
      const createReq: CreateModifierRequestInterface = { name: 'update all values', description: 'This is a test', price: 100 };

      mockVerify();
      const cRes = await request(app.getServer())
        .post('/modifier')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createReq)
        .expect(200);

      const modifierID = cRes.body.modifierID;

      mockVerify();
      await request(app.getServer()).delete(`/modifiers/${modifierID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);

      // cleanup
      await removeModifier(modifierID);
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

const removeModifier = async (modifierID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(ModifierEntity, modifierID);
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
