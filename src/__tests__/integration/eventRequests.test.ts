import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ormConnection } from '@utils/dbUtils';
import { EventRequestEntity } from '@/entities/eventRequest.entity';
import { EventSettingsEntity } from '@/entities/eventSettings.entity';
import { EventMediaEntity } from '@/entities/eventMedia.entity';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { EventRequestResponseInterface } from '@interfaces/eventRequests.interface';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('jsonwebtoken', () => {
  const jwt = { verify: jest.fn() };
  return { __esModule: true, default: jwt };
});
jest.mock('@/services/auth.service', () => {
  const mockAuthService = { validateManager: jest.fn() };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = { MAX_MULTER_FILE_SIZE_LIMIT: 75000000 };
  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    imageUpload: { fields: jest.fn() },
    deleteMediaIfExists: jest.fn(),
    obtainMedia: jest.fn((url: string) => `https://cdn.example.test/${url}`),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return { __esModule: true, logger, initializeLogger: jest.fn() };
});

const mockAuthService = new AuthService(new UsersModel());

const RESTAURANT_ID = 1;
const ANOTHER_RESTAURANT_ID = 8;

const buildSeedRow = (overrides: Partial<EventRequestEntity> = {}): Partial<EventRequestEntity> => ({
  restaurant_id: RESTAURANT_ID,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '212-555-0100',
  type_of_event: 'Birthday Party',
  style_of_event: 'Full catering',
  event_at: '2026-08-15T18:00:00.000Z',
  number_of_people: 30,
  status: 'new',
  ...overrides,
});

describe('eventRequests + eventSettings + eventMedia API', () => {
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

  describe('GET /eventSettings', () => {
    it('should return defaults when never configured', async () => {
      mockVerify();
      await resetRestaurantEventColumns(RESTAURANT_ID);

      const res = await request(app.getServer())
        .get('/eventSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toEqual({
        isEventsEnabled: false,
        sectionTitle: '',
        eventsText: '',
        deckUrl: null,
        isInquiryFormEnabled: false,
        notificationEmail: null,
      });
    });

    it('should reject without authorization headers', async () => {
      await request(app.getServer()).get('/eventSettings').expect(401);
    });
  });

  describe('PUT /eventSettings', () => {
    it('should toggle the events flag, persist content, and return the saved values', async () => {
      mockVerify();
      await resetRestaurantEventColumns(RESTAURANT_ID);

      const res = await request(app.getServer())
        .put('/eventSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({
          isEventsEnabled: true,
          sectionTitle: "Bob's Crab Shack",
          eventsText: 'Host your event here.',
          isInquiryFormEnabled: true,
          notificationEmail: 'pilot@example.com',
        })
        .expect(200);

      expect(res.body).toEqual({
        isEventsEnabled: true,
        sectionTitle: "Bob's Crab Shack",
        eventsText: 'Host your event here.',
        deckUrl: null,
        isInquiryFormEnabled: true,
        notificationEmail: 'pilot@example.com',
      });

      const reread = await request(app.getServer())
        .get('/eventSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(reread.body).toMatchObject({ isEventsEnabled: true, sectionTitle: "Bob's Crab Shack" });
    });

    it('should clear deckUrl when null is explicitly provided', async () => {
      mockVerify();
      await resetRestaurantEventColumns(RESTAURANT_ID);
      await seedSettings({ deck_url: 'https://example.com/old.pdf' });

      const res = await request(app.getServer())
        .put('/eventSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ isEventsEnabled: true, deckUrl: null })
        .expect(200);

      expect(res.body.deckUrl).toBeNull();
    });

    it('should reject an invalid email shape', async () => {
      mockVerify();
      await request(app.getServer())
        .put('/eventSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ isEventsEnabled: true, notificationEmail: 'not-an-email' })
        .expect(400);
    });

    it('should reject a non-URL deckUrl', async () => {
      mockVerify();
      await request(app.getServer())
        .put('/eventSettings')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ isEventsEnabled: true, deckUrl: 'not-a-url' })
        .expect(400);
    });
  });

  describe('GET /eventRequests', () => {
    it('should return an empty list when none exist for the restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer())
        .get('/eventRequests')
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
        .get('/eventRequests')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].firstName).toEqual('Second');
      expect(res.body[1].firstName).toEqual('First');
    });

    it('should filter by status and not leak rows from other restaurants', async () => {
      mockVerify();
      const myNewRow = await seedRequest({ status: 'new', first_name: 'MineNew' });
      await seedRequest({ status: 'archived', first_name: 'MineOld' });
      await seedRequest({ restaurant_id: ANOTHER_RESTAURANT_ID, status: 'new', first_name: 'NotMineNew' });

      const res = await request(app.getServer())
        .get('/eventRequests?status=new')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].eventRequestID).toEqual(myNewRow.event_request_id);
      expect(res.body[0].firstName).toEqual('MineNew');
    });

    it('should reject an invalid status query value', async () => {
      mockVerify();
      await request(app.getServer())
        .get('/eventRequests?status=BOGUS')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(400);
    });
  });

  describe('GET /eventRequests/:id', () => {
    it('should return the row when it exists', async () => {
      mockVerify();
      const row = await seedRequest();

      const res = await request(app.getServer())
        .get(`/eventRequests/${row.event_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      const body = res.body as EventRequestResponseInterface;
      expect(body.eventRequestID).toEqual(row.event_request_id);
      expect(body.firstName).toEqual('Jane');
      expect(body.styleOfEvent).toEqual('Full catering');
    });

    it('should 404 when the row does not exist', async () => {
      mockVerify();
      await request(app.getServer())
        .get('/eventRequests/999999')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);
    });

    it('should 404 when the row belongs to another restaurant', async () => {
      mockVerify();
      const row = await seedRequest({ restaurant_id: ANOTHER_RESTAURANT_ID });

      await request(app.getServer())
        .get(`/eventRequests/${row.event_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);
    });
  });

  describe('PUT /eventRequests/:id/status', () => {
    it('should update the status and return the new entity', async () => {
      mockVerify();
      const row = await seedRequest({ status: 'new' });

      const res = await request(app.getServer())
        .put(`/eventRequests/${row.event_request_id}/status`)
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
        .put(`/eventRequests/${row.event_request_id}/status`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ status: 'BOGUS' })
        .expect(400);
    });
  });

  describe('DELETE /eventRequests/:id', () => {
    it('should soft-delete and respond 204; subsequent GETs treat the row as missing', async () => {
      mockVerify();
      const row = await seedRequest();

      await request(app.getServer())
        .delete(`/eventRequests/${row.event_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(204);

      await request(app.getServer())
        .get(`/eventRequests/${row.event_request_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(404);

      // Row physically remains — confirms soft delete.
      const repository = await ormConnection();
      const physicalRow = await repository.findOne(EventRequestEntity, row.event_request_id);
      expect(physicalRow).toBeDefined();
      expect(physicalRow.deleted_at).not.toBeNull();
    });
  });

  describe('GET /eventMedia', () => {
    it('should return an empty list when none exist', async () => {
      mockVerify();
      const res = await request(app.getServer())
        .get('/eventMedia')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('should return seeded rows ordered by list_order ASC, with host-prefixed mediaUrl', async () => {
      mockVerify();
      await seedMedia({ media_url: 'b.jpg', media_type: 'image', list_order: 1 });
      await seedMedia({ media_url: 'a.jpg', media_type: 'image', list_order: 0 });

      const res = await request(app.getServer())
        .get('/eventMedia')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].listOrder).toEqual(0);
      expect(res.body[0].mediaUrl).toContain('a.jpg');
      expect(res.body[1].mediaUrl).toContain('b.jpg');
    });

    it('should not leak rows from other restaurants', async () => {
      mockVerify();
      await seedMedia({ restaurant_id: ANOTHER_RESTAURANT_ID, media_url: 'leaky.jpg', list_order: 0 });

      const res = await request(app.getServer())
        .get('/eventMedia')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('PUT /eventMedia/reorder', () => {
    it('should reorder a full snapshot', async () => {
      mockVerify();
      const a = await seedMedia({ media_url: 'a.jpg', list_order: 0 });
      const b = await seedMedia({ media_url: 'b.jpg', list_order: 1 });

      await request(app.getServer())
        .put('/eventMedia/reorder')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({
          items: [
            { eventMediaID: a.event_media_id, listOrder: 1 },
            { eventMediaID: b.event_media_id, listOrder: 0 },
          ],
        })
        .expect(204);

      const res = await request(app.getServer())
        .get('/eventMedia')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);

      expect(res.body[0].eventMediaID).toEqual(b.event_media_id);
      expect(res.body[1].eventMediaID).toEqual(a.event_media_id);
    });

    it('should 400 a partial-snapshot reorder', async () => {
      mockVerify();
      await seedMedia({ media_url: 'a.jpg', list_order: 0 });
      const b = await seedMedia({ media_url: 'b.jpg', list_order: 1 });

      await request(app.getServer())
        .put('/eventMedia/reorder')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({ items: [{ eventMediaID: b.event_media_id, listOrder: 0 }] })
        .expect(400);
    });

    it('should 404 when a requested id is not owned by the restaurant', async () => {
      mockVerify();
      // Two items owned by RESTAURANT_ID so the full-snapshot count matches,
      // then we substitute a foreign id in place of one of them. This isolates
      // the ownership check from the partial-snapshot check.
      const a = await seedMedia({ media_url: 'a.jpg', list_order: 0 });
      await seedMedia({ media_url: 'b.jpg', list_order: 1 });
      const notMine = await seedMedia({ restaurant_id: ANOTHER_RESTAURANT_ID, media_url: 'x.jpg', list_order: 0 });

      await request(app.getServer())
        .put('/eventMedia/reorder')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .send({
          items: [
            { eventMediaID: a.event_media_id, listOrder: 0 },
            { eventMediaID: notMine.event_media_id, listOrder: 1 },
          ],
        })
        .expect(404);
    });
  });

  describe('DELETE /eventMedia/:id', () => {
    it('should soft-delete and respond 204; subsequent list omits the row', async () => {
      mockVerify();
      const row = await seedMedia({ media_url: 'a.jpg', list_order: 0 });

      await request(app.getServer())
        .delete(`/eventMedia/${row.event_media_id}`)
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(204);

      const list = await request(app.getServer())
        .get('/eventMedia')
        .set('Authorization', 'token')
        .set('restaurantID', String(RESTAURANT_ID))
        .expect(200);
      expect(list.body).toEqual([]);

      // Soft-delete leaves the row physically present.
      const repository = await ormConnection();
      const physicalRow = await repository.findOne(EventMediaEntity, row.event_media_id);
      expect(physicalRow).toBeDefined();
      expect(physicalRow.deleted_at).not.toBeNull();
    });

    it('should 404 when the row does not exist', async () => {
      mockVerify();
      await request(app.getServer())
        .delete('/eventMedia/999999')
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

const seedRequest = async (overrides: Partial<EventRequestEntity> = {}): Promise<EventRequestEntity> => {
  const repository = await ormConnection();
  const result = await repository.insert(EventRequestEntity, buildSeedRow(overrides));
  return { ...buildSeedRow(overrides), event_request_id: result.identifiers[0].event_request_id } as EventRequestEntity;
};

const seedSettings = async (overrides: Partial<EventSettingsEntity> = {}): Promise<EventSettingsEntity> => {
  const repository = await ormConnection();
  const created = repository.create(EventSettingsEntity, {
    restaurant_id: RESTAURANT_ID,
    section_title: '',
    events_text: '',
    is_inquiry_form_enabled: false,
    ...overrides,
  });
  return await repository.save(EventSettingsEntity, created);
};

const seedMedia = async (overrides: Partial<EventMediaEntity> = {}): Promise<EventMediaEntity> => {
  const repository = await ormConnection();
  const seed: Partial<EventMediaEntity> = {
    restaurant_id: RESTAURANT_ID,
    media_url: 'placeholder.jpg',
    media_type: 'image',
    list_order: 0,
    ...overrides,
  };
  const result = await repository.insert(EventMediaEntity, seed);
  return { ...seed, event_media_id: result.identifiers[0].event_media_id } as EventMediaEntity;
};

const cleanupAll = async () => {
  const repository = await ormConnection();
  await repository
    .createQueryBuilder()
    .delete()
    .from(EventRequestEntity)
    .where('restaurant_id IN (:...ids)', { ids: [RESTAURANT_ID, ANOTHER_RESTAURANT_ID] })
    .execute();
  await repository
    .createQueryBuilder()
    .delete()
    .from(EventMediaEntity)
    .where('restaurant_id IN (:...ids)', { ids: [RESTAURANT_ID, ANOTHER_RESTAURANT_ID] })
    .execute();
  await repository
    .createQueryBuilder()
    .delete()
    .from(EventSettingsEntity)
    .where('restaurant_id IN (:...ids)', { ids: [RESTAURANT_ID, ANOTHER_RESTAURANT_ID] })
    .execute();
  await resetRestaurantEventColumns(RESTAURANT_ID);
  await resetRestaurantEventColumns(ANOTHER_RESTAURANT_ID);
};

const resetRestaurantEventColumns = async (restaurantID: number) => {
  const repository = await ormConnection();
  await repository.update(RestaurantEntity, { restaurant_id: restaurantID }, { is_events_enabled: false });
};
