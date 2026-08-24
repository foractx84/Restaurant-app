import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ormConnection } from '@utils/dbUtils';
import { CateringRequestEntity } from '@/entities/cateringRequest.entity';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { CateringRequestResponseInterface } from '@interfaces/cateringRequests.interface';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = { MAX_MULTER_FILE_SIZE_LIMIT: 75000000 };
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

const mockAuthService = new AuthService(new UsersModel());

const RESTAURANT_ID = 1;
const ANOTHER_RESTAURANT_ID = 8;

const buildSeedRow = (overrides: Partial<CateringRequestEntity> = {}): Partial<CateringRequestEntity> => ({
  restaurant_id: RESTAURANT_ID,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '212-555-0100',
  street_address_1: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  number_of_people: 50,
  type_of_event: 'Wedding',
  event_start_at: '2026-08-15T18:00:00.000Z',
  event_end_at: '2026-08-15T22:00:00.000Z',
  special_requests: 'Vegan options for 8 guests',
  status: 'new',
  ...overrides,
});

describe('cateringRequests + cateringSettings API', () => {
  beforeAll(async () => {
    await getConnection().connect();
    await cleanupAll();
  });

  beforeEach(async () => {
    await cleanupAll();
  });

  afterAll(async () => {
    await cleanupAll();
    await getConnection().close();
  });

  describe('GET /cateringSettings', () => {
    it('should return defaults when never configured', async () => {
      mockVerify();
      await resetRestaurantCateringColumns(RESTAURANT_ID);

      const res = await request(app.getServer())
        .get('/cateringSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toEqual({ isCateringEnabled: false, cateringNotificationEmail: null });
    });

    it('should return configured settings', async () => {
      mockVerify();
      await setRestaurantCateringColumns(RESTAURANT_ID, true, 'events@example.com');

      const res = await request(app.getServer())
        .get('/cateringSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toEqual({ isCateringEnabled: true, cateringNotificationEmail: 'events@example.com' });
    });

    it('should reject without authorization headers', async () => {
      await request(app.getServer()).get('/cateringSettings').expect(401);
    });
  });

  describe('PUT /cateringSettings', () => {
    it('should toggle the catering flag and persist', async () => {
      mockVerify();
      await resetRestaurantCateringColumns(RESTAURANT_ID);

      const res = await request(app.getServer())
        .put('/cateringSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ isCateringEnabled: true, cateringNotificationEmail: 'pilot@example.com' })
        .expect(200);

      expect(res.body).toEqual({ isCateringEnabled: true, cateringNotificationEmail: 'pilot@example.com' });

      const reread = await request(app.getServer())
        .get('/cateringSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(reread.body).toEqual({ isCateringEnabled: true, cateringNotificationEmail: 'pilot@example.com' });
    });

    it('should clear the email when null is provided explicitly', async () => {
      mockVerify();
      await setRestaurantCateringColumns(RESTAURANT_ID, true, 'old@example.com');

      const res = await request(app.getServer())
        .put('/cateringSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ isCateringEnabled: true, cateringNotificationEmail: null })
        .expect(200);

      expect(res.body.cateringNotificationEmail).toBeNull();
    });

    it('should reject an invalid email shape', async () => {
      mockVerify();
      await request(app.getServer())
        .put('/cateringSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ isCateringEnabled: true, cateringNotificationEmail: 'not-an-email' })
        .expect(400);
    });
  });

  describe('GET /cateringRequests', () => {
    it('should return an empty list when none exist for the restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer())
        .get('/cateringRequests')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('should list rows in created_at DESC order', async () => {
      mockVerify();
      await seedRequest({ first_name: 'First' });
      await seedRequest({ first_name: 'Second' });

      const res = await request(app.getServer())
        .get('/cateringRequests')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].firstName).toEqual('Second');
      expect(res.body[1].firstName).toEqual('First');
    });

    it('should filter by status', async () => {
      mockVerify();
      const newRow = await seedRequest({ status: 'new', first_name: 'NewGuy' });
      await seedRequest({ status: 'archived', first_name: 'OldGuy' });

      const newOnly = await request(app.getServer())
        .get('/cateringRequests?status=new')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(newOnly.body).toHaveLength(1);
      expect(newOnly.body[0].cateringRequestID).toEqual(newRow.catering_request_id);
    });

    it('should respect both restaurant scope and status filter together', async () => {
      mockVerify();
      const myNewRow = await seedRequest({ status: 'new', first_name: 'MineNew' });
      await seedRequest({ status: 'archived', first_name: 'MineOld' });
      // Same status='new' on a DIFFERENT restaurant — must not leak into our list.
      await seedRequest({ restaurant_id: ANOTHER_RESTAURANT_ID, status: 'new', first_name: 'NotMineNew' });

      const res = await request(app.getServer())
        .get('/cateringRequests?status=new')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].cateringRequestID).toEqual(myNewRow.catering_request_id);
      expect(res.body[0].firstName).toEqual('MineNew');
    });

    it('should not return rows from other restaurants', async () => {
      mockVerify();
      await seedRequest({ restaurant_id: ANOTHER_RESTAURANT_ID, first_name: 'NotMine' });

      const res = await request(app.getServer())
        .get('/cateringRequests')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('should reject an invalid status query value', async () => {
      mockVerify();
      await request(app.getServer())
        .get('/cateringRequests?status=BOGUS')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(400);
    });
  });

  describe('GET /cateringRequests/:id', () => {
    it('should return the row when it exists', async () => {
      mockVerify();
      const row = await seedRequest();

      const res = await request(app.getServer())
        .get(`/cateringRequests/${row.catering_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      const body = res.body as CateringRequestResponseInterface;
      expect(body.cateringRequestID).toEqual(row.catering_request_id);
      expect(body.firstName).toEqual('Jane');
      expect(body.specialRequests).toEqual('Vegan options for 8 guests');
    });

    it('should 404 when the row does not exist', async () => {
      mockVerify();
      await request(app.getServer())
        .get('/cateringRequests/999999')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);
    });

    it('should 404 when the row exists for another restaurant', async () => {
      mockVerify();
      const row = await seedRequest({ restaurant_id: ANOTHER_RESTAURANT_ID });

      await request(app.getServer())
        .get(`/cateringRequests/${row.catering_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);
    });
  });

  describe('PUT /cateringRequests/:id/status', () => {
    it('should update the status and bump updated_at', async () => {
      mockVerify();
      const row = await seedRequest({ status: 'new' });

      const res = await request(app.getServer())
        .put(`/cateringRequests/${row.catering_request_id}/status`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ status: 'viewed' })
        .expect(200);

      expect(res.body.status).toEqual('viewed');
    });

    it('should reject an invalid status value', async () => {
      mockVerify();
      const row = await seedRequest();

      await request(app.getServer())
        .put(`/cateringRequests/${row.catering_request_id}/status`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ status: 'BOGUS' })
        .expect(400);
    });

    it('should 404 when the row does not exist', async () => {
      mockVerify();
      await request(app.getServer())
        .put('/cateringRequests/999999/status')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ status: 'viewed' })
        .expect(404);
    });
  });

  describe('DELETE /cateringRequests/:id', () => {
    it('should soft-delete and respond 204; subsequent GETs treat the row as missing', async () => {
      mockVerify();
      const row = await seedRequest();

      await request(app.getServer())
        .delete(`/cateringRequests/${row.catering_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(204);

      await request(app.getServer())
        .get(`/cateringRequests/${row.catering_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);

      const list = await request(app.getServer())
        .get('/cateringRequests')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(list.body).toEqual([]);

      // Row is still in the DB physically — confirms it's a soft delete.
      const repository = await ormConnection();
      const physicalRow = await repository.findOne(CateringRequestEntity, row.catering_request_id);
      expect(physicalRow).toBeDefined();
      expect(physicalRow.deleted_at).not.toBeNull();
    });

    it('should 404 when the row does not exist', async () => {
      mockVerify();
      await request(app.getServer())
        .delete('/cateringRequests/999999')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);
    });
  });
});

const mockVerify = (managerID = 999) => {
  const decoded = { managerID };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValue(true);
};

const seedRequest = async (overrides: Partial<CateringRequestEntity> = {}): Promise<CateringRequestEntity> => {
  const repository = await ormConnection();
  const result = await repository.insert(CateringRequestEntity, buildSeedRow(overrides));
  return { ...buildSeedRow(overrides), catering_request_id: result.identifiers[0].catering_request_id } as CateringRequestEntity;
};

const cleanupAll = async () => {
  const repository = await ormConnection();
  await repository
    .createQueryBuilder()
    .delete()
    .from(CateringRequestEntity)
    .where('restaurant_id IN (:...ids)', { ids: [RESTAURANT_ID, ANOTHER_RESTAURANT_ID] })
    .execute();
  await resetRestaurantCateringColumns(RESTAURANT_ID);
  await resetRestaurantCateringColumns(ANOTHER_RESTAURANT_ID);
};

const resetRestaurantCateringColumns = async (restaurantID: number) => {
  const repository = await ormConnection();
  await repository.update(RestaurantEntity, { restaurant_id: restaurantID }, { is_catering_enabled: false, catering_notification_email: null });
};

const setRestaurantCateringColumns = async (restaurantID: number, isEnabled: boolean, email: string | null) => {
  const repository = await ormConnection();
  await repository.update(RestaurantEntity, { restaurant_id: restaurantID }, { is_catering_enabled: isEnabled, catering_notification_email: email });
};
