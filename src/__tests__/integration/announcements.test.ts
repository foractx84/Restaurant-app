import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import {
  CreateAnnouncementRequestInterface,
  CreateAnnouncementResponseInterface,
  EditAnnouncementRequestInterface,
  GetAnnouncementsResponseInterface,
} from '@interfaces/announcements.interface';
import { DateTime } from 'luxon';
import { ormConnection } from '@utils/dbUtils';
import { AnnouncementEntity } from '@/entities/announcement.entity';
import { getCurrentTimeForTimeZone } from '@utils/timeUtils';
import { AnnouncementType } from '@/enums/announcementType';
import { AnnouncementImageEntity } from '@/entities/announcementImage.entity';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

// mock jwt.verify until a test token is generated
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
  const MOCKED_APP_CONFIG = {
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

const mockAuthService = new AuthService(new UsersModel());

describe('announcements API', () => {
  const EST_TIMEZONE = 'America/New_York';

  // Track created announcements for cleanup
  const createdAnnouncementIDs: number[] = [];

  // Helper function to track announcement for cleanup
  const trackAnnouncement = (announcementID: number): void => {
    if (announcementID && !createdAnnouncementIDs.includes(announcementID)) {
      createdAnnouncementIDs.push(announcementID);
    }
  };

  // Cleanup helper to process tracked announcements
  const cleanupTrackedAnnouncements = async (): Promise<void> => {
    const cleanupPromises = createdAnnouncementIDs.map(id =>
      removeAnnouncement(id).catch(() => {
        // Ignore individual errors
      }),
    );
    await Promise.all(cleanupPromises);
    createdAnnouncementIDs.length = 0;
  };

  // ensure api is connected to database before starting
  beforeAll(async () => {
    await setUp();
    await cleanupTestAnnouncements();
  });

  // Clean up test data before each test to prevent duplicate key errors
  beforeEach(async () => {
    await cleanupTestAnnouncements();
  });

  // Clean up created announcements after each test, even if it fails
  afterEach(async () => {
    await cleanupTrackedAnnouncements();
  });

  // clean up database and anything else done by tests
  afterAll(async () => {
    await cleanupTestAnnouncements();
    await cleanUp();
  });

  const buildCreateAnnouncementRequest = (
    isActive: boolean,
    name = 'Test Name',
    modalType = AnnouncementType.MODAL,
    title?: string,
    description?: string,
    submitEmail = false,
  ): CreateAnnouncementRequestInterface => {
    const startDate = getCurrentTimeForTimeZone('en-US', EST_TIMEZONE);
    const endDate = getCurrentTimeForTimeZone('en-US', EST_TIMEZONE);

    const startMonth = startDate.getMonth();
    if (startMonth === 0) {
      startDate.setMonth(-1);
      startDate.setMonth(10);
    } else {
      startDate.setMonth(startMonth - 2);
    }

    const endMonth = endDate.getMonth();
    if (isActive) {
      endDate.setMonth(endMonth + 1);
    } else {
      endDate.setMonth(endMonth - 1);
    }

    const request = {
      name,
      title: title || 'Test title',
      description: description || 'Test description',
      startDate: startDate.toISOString().replace('Z', ''),
      endDate: endDate.toISOString().replace('Z', ''),
      type: modalType,
      submitEmail,
    };
    if (modalType === AnnouncementType.EMBED) {
      delete request.title;
      delete request.description;
    }
    return request;
  };

  const buildEditAnnouncementRequest = (
    announcementID: number,
    isActive: boolean,
    name = 'test',
    modalType = AnnouncementType.MODAL,
  ): EditAnnouncementRequestInterface => {
    const createRequest = buildCreateAnnouncementRequest(isActive, name, modalType);

    return {
      announcementID,
      description: createRequest.description,
      endDate: createRequest.endDate,
      name: name || null,
      startDate: createRequest.startDate,
      title: createRequest.title,
    };
  };

  const assertAnnouncementCreationResponse = (response: CreateAnnouncementResponseInterface, isActive: boolean, type = AnnouncementType.MODAL) => {
    expect(typeof response.announcementID).toEqual('number');
    expect(typeof response.name).toEqual('string');
    expect(typeof response.title).toEqual('string');
    expect(typeof response.description).toEqual('string');
    expect(DateTime.fromISO(response.startDate, { zone: 'utc' }).isValid).toEqual(true);
    expect(DateTime.fromISO(response.endDate, { zone: 'utc' }).isValid).toEqual(true);
    expect(response.hidden).toEqual(false);
    expect(response.active).toEqual(isActive);
    expect(response.type).toEqual(type);
    expect(typeof response.submitEmail).toEqual('boolean');
  };

  const assertAnnouncementGetResponse = (
    firstCreatedAnnouncement: GetAnnouncementsResponseInterface,
    isFirstActive = true,
    isFirstHidden = false,
    subsequentAnnouncements?: GetAnnouncementsResponseInterface[],
  ) => {
    [...[firstCreatedAnnouncement], ...subsequentAnnouncements].forEach(response => {
      expect(typeof response.announcementID).toEqual('number');
      expect(typeof response.name).toEqual('string');
      expect(typeof response.title).toEqual('string');
      expect(typeof response.description).toEqual('string');
      expect(DateTime.fromISO(response.startDate, { zone: 'utc' }).isValid).toEqual(true);
      expect(DateTime.fromISO(response.endDate, { zone: 'utc' }).isValid).toEqual(true);
      if (response.announcementID === firstCreatedAnnouncement?.announcementID) {
        expect(response.active).toEqual(isFirstActive);
        expect(response.hidden).toEqual(isFirstHidden);
      } else {
        expect(response.active).toEqual(false);
        expect(response.hidden).toEqual(false);
      }
      expect(typeof response.submitEmail).toEqual('boolean');

      expect(response.image).toEqual({});
      expect(typeof response.type).toEqual('string');
    });
  };

  // takes the given timestamp and offsets it by N months based on the offsetMonth parameter
  // 2022-10-02T10:49:00.000 with offsetMonth = 1 -> 2022-11-02T10:51:01.000
  // 2022-10-02T10:49:00.000 with offsetMonth = -1 -> 2022-09-02T10:51:20.000
  // 2022-10-02T10:49:00.000 with offsetMonth = 3 -> 2023-01-02T10:50:04.000
  // 2022-10-02T10:49:00.000 with offsetMonth = -11 -> 2021-11-02T10:50:37.000
  const buildOverlappingTimeSpanTest = (timestamp: string, offsetMonth: number) => {
    const date = new Date(timestamp);
    return new Date(date.setMonth(date.getMonth() + offsetMonth)).toISOString().replace('Z', '');
  };

  describe('POST /announcement', () => {
    it('should successfully create active modal announcement', async () => {
      const mReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      try {
        const mRes = await request(app.getServer())
          .post('/announcement')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(mReq)
          .expect(200);
        const response: CreateAnnouncementResponseInterface = mRes.body;
        assertAnnouncementCreationResponse(response, true);
        expect(response.submitEmail).toEqual(false);
        // Track for cleanup
        trackAnnouncement(response.announcementID);
      } catch (err) {
        // Track for cleanup even on failure if we got an ID
        throw err;
      }
    });
    it('should successfully create inactive modal announcement with email submission functionality', async () => {
      const mReq = buildCreateAnnouncementRequest(false);
      mockVerify();
      const mRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...mReq, submitEmail: true })
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mRes.body;
      assertAnnouncementCreationResponse(response, false);
      expect(response.submitEmail).toEqual(true);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully create active embed announcement with EMPTY description and EMPTY title', async () => {
      const mReq = buildCreateAnnouncementRequest(true, 'Test name', AnnouncementType.EMBED);
      delete mReq.title;
      delete mReq.description;
      mockVerify();
      const mRes = await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(200);
      const response: CreateAnnouncementResponseInterface = mRes.body;
      assertAnnouncementCreationResponse(response, true, AnnouncementType.EMBED);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully create inactive embed announcement with EMPTY description and EMPTY title', async () => {
      const mReq = buildCreateAnnouncementRequest(false, 'Test name', AnnouncementType.EMBED);
      delete mReq.title;
      delete mReq.description;
      mockVerify();
      const mRes = await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(200);
      const response: CreateAnnouncementResponseInterface = mRes.body;
      assertAnnouncementCreationResponse(response, false, AnnouncementType.EMBED);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully create modal announcement that overlaps with an existing but hidden modal announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);
      const hideReq1 = {
        announcementID: response1.announcementID,
        hide: true,
      };

      // hide the created announcement #1
      await request(app.getServer()).put('/announcement/hide').set('Authorization', 'token').set('restaurantID', '1').send(hideReq1).expect(200);

      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mRes2.body;

      assertAnnouncementCreationResponse(response2, true);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully create embed announcement with overlapping time span with an existing modal announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2', AnnouncementType.EMBED);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mRes2.body;

      assertAnnouncementCreationResponse(response2, true, AnnouncementType.EMBED);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully create modal announcement with start and end time before an existing modal announcement start time', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, -12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.endDate, -12);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mRes2.body;

      assertAnnouncementCreationResponse(response2, false);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully create modal announcement with start and end time after an existing modal announcement end time', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.endDate, 12);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mRes2.body;

      assertAnnouncementCreationResponse(response2, false);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully create announcement with same name as announcement for another restaurant', async () => {
      const mReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mRes1.body;
      assertAnnouncementCreationResponse(response, true);

      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '8')
        .send(mReq)
        .expect(200);

      trackAnnouncement(response.announcementID);
      trackAnnouncement(mRes2.body.announcementID);
    });
    it('should successfully create drawer announcement', async () => {
      const mReq = buildCreateAnnouncementRequest(true, 'Test Drawer Announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mRes1.body;
      assertAnnouncementCreationResponse(response, true, AnnouncementType.DRAWER);

      trackAnnouncement(response.announcementID);
    });
    it('should successfully create drawer announcement with overlapping time span of embed announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test Embed Announcement', AnnouncementType.EMBED);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      assertAnnouncementCreationResponse(response1, true, AnnouncementType.EMBED);

      const mReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer Announcement', AnnouncementType.DRAWER);

      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '8')
        .send(mReq2)
        .expect(200);

      assertAnnouncementCreationResponse(mRes2.body, true, AnnouncementType.DRAWER);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(mRes2.body.announcementID);
    });
    it('should throw 409 if drawer announcement being created overlaps with time span of other drawer announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test Embed Announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      assertAnnouncementCreationResponse(response1, true, AnnouncementType.DRAWER);

      const mReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer Announcement', AnnouncementType.DRAWER);

      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq2).expect(409);

      trackAnnouncement(response1.announcementID);
    });
    it('should throw 409 if drawer announcement being created overlaps with time span of other MODAL announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test Embed Announcement', AnnouncementType.MODAL);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      assertAnnouncementCreationResponse(response1, true);

      const mReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer Announcement', AnnouncementType.DRAWER);

      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq2).expect(409);

      trackAnnouncement(response1.announcementID);
    });
    it('should return 409 resource conflict if announcement with the same name already exists for a restaurant', async () => {
      mockVerify();

      const mReq = buildCreateAnnouncementRequest(true);

      const mRes = await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(200);
      await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(buildCreateAnnouncementRequest(true))
        .expect(409);
      const response: CreateAnnouncementResponseInterface = mRes.body;
      trackAnnouncement(response.announcementID);
    });
    it('should return 400 Bad Request if provided end date is prior to start date when creating announcement ', async () => {
      mockVerify();
      const date = getCurrentTimeForTimeZone('en-US', EST_TIMEZONE);
      const month = date.getMonth();
      date.setMonth(month === 0 ? 11 : month - 1);
      const mReq = {
        name: 'Test',
        title: 'Title',
        description: 'Test description',
        startDate: getCurrentTimeForTimeZone('en-US', EST_TIMEZONE).toISOString().replace('Z', ''),
        endDate: date.toISOString().replace('Z', ''),
      } as CreateAnnouncementRequestInterface;
      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(400);
    });
    it('should throw 400 bad request if announcement is modal type but does not have a title or description', async () => {
      mockVerify();

      const mReq = buildCreateAnnouncementRequest(true, 'Test name', AnnouncementType.MODAL);
      delete mReq.description;
      delete mReq.title;
      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(400);
    });
    it('should throw 400 bad request if announcement title is longer than 70 characters', async () => {
      mockVerify();
      const longTitle =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent aliquam sem ac ipsum pulvinar bibendum. In sed diam rhoncus, consectetur lacus vel, molestie mi.';
      const mReq = buildCreateAnnouncementRequest(true, 'Test name', AnnouncementType.MODAL, longTitle);
      delete mReq.description;
      delete mReq.title;
      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(400);
    });
    it('should throw 400 bad request if announcement is embedded type and submit email is true', async () => {
      mockVerify();

      const mReq = buildCreateAnnouncementRequest(true, 'Test name', AnnouncementType.EMBED, null, null, true);
      delete mReq.description;
      delete mReq.title;
      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(400);
    });
    it('should throw 409 if modal announcement has overlapping start time between start time and end time of an already existing modal announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 1);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.endDate, 1);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq2).expect(409);

      trackAnnouncement(response1.announcementID);
    });
    it('should throw 409 if modal announcement has overlapping end time between start time and end time of an already existing modal announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, -1);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.endDate, -1);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq2).expect(409);

      trackAnnouncement(response1.announcementID);
    });
    it('should throw 409 if modal announcement has overlapping start and end time between another existing modal announcement start and end time', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 1);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.endDate, -1);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq2).expect(409);

      trackAnnouncement(response1.announcementID);
    });
    it('should throw 409 if modal announcement has start time that begins before existing announement start time, and end time and end time that occurs after existing announcment end time', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test name 2');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, -12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.endDate, 12);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mRes1.body;

      assertAnnouncementCreationResponse(response1, true);

      await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq2).expect(409);

      trackAnnouncement(response1.announcementID);
    });
  });
  describe('DELETE /announcement/:announcementID', () => {
    it('should successfully soft delete announcement of restaurant', async () => {
      const mReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mRes = await request(app.getServer()).post('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(200);
      const response: CreateAnnouncementResponseInterface = mRes.body;
      mockVerify();
      await request(app.getServer())
        .delete(`/announcement/${response.announcementID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should throw 404 and not soft delete announcement that doesnt exist in database', async () => {
      const ANNOUNCEMENT_ID = 999999;
      mockVerify();
      await request(app.getServer()).delete(`/announcement/${ANNOUNCEMENT_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(404);
    });
    it('should throw 400 and not soft delete announcement that has invalid announcementID value', async () => {
      const ANNOUNCEMENT_ID = 'test';
      mockVerify();
      await request(app.getServer()).delete(`/announcement/${ANNOUNCEMENT_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(400);
    });
  });
  describe('PUT /announcement', () => {
    it('should successfully update active announcement', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, null);
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully update active name of announcement', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'Name Change');
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully update active name of announcement when another restaurant has announcement with the same name', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '8')
        .send(mCreateReq)
        .expect(200);

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'Name Change');
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response.announcementID);
      trackAnnouncement(mCreateRes2.body.announcementID);
    });
    it('should successfully update inactive announcement', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, false, null);
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(false);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully update embed announcement to timespan of another existing, modal announcement', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);

      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Embed announcement', AnnouncementType.EMBED);
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null, AnnouncementType.EMBED);

      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully update modal announcement to timespan of another existing, hidden modal announcement', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const hideReq1 = {
        announcementID: response1.announcementID,
        hide: true,
      };

      // hide the created announcement #1
      await request(app.getServer()).put('/announcement/hide').set('Authorization', 'token').set('restaurantID', '1').send(hideReq1).expect(200);

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal announcement');
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully update HIDDEN modal announcement to timespan of another existing, modal announcement', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(false, 'Test Second Modal announcement');
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const hideReq2 = {
        announcementID: response2.announcementID,
        hide: true,
      };

      // hide the created announcement #1
      await request(app.getServer()).put('/announcement/hide').set('Authorization', 'token').set('restaurantID', '1').send(hideReq2).expect(200);

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(false);
      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully update drawer announcement to timespan of another existing, embed announcement', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test Embed announcement', AnnouncementType.EMBED);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer announcement', AnnouncementType.DRAWER);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it.each([
      {
        type: AnnouncementType.DRAWER,
      },
      {
        type: AnnouncementType.MODAL,
      },
    ])('should successfully toggle email submission for announcement of type: $type', async ({ type }) => {
      const mCreateReq = buildCreateAnnouncementRequest(true, type);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'test', type);
      await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...mEditReq, submitEmail: true })
        .expect(200);

      await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...mEditReq, submitEmail: false })
        .expect(200);

      trackAnnouncement(response.announcementID);
    });
    it.each([
      {
        type: AnnouncementType.DRAWER,
      },
      {
        type: AnnouncementType.MODAL,
      },
    ])(
      'should successfully toggle type from drawer / modal to embed for announcement successfully (200) and announcment has existing image',
      async ({ type }) => {
        const mCreateReq = buildCreateAnnouncementRequest(true, 'test', type);
        mockVerify();
        const mCreateRes = await request(app.getServer())
          .post('/announcement')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(mCreateReq)
          .expect(200);
        const response: CreateAnnouncementResponseInterface = mCreateRes.body;

        const announcementImage = await buildAnnouncementImage(response.announcementID);

        const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'test', AnnouncementType.EMBED);
        await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(200);

        await removeAnnouncementImage(announcementImage.announcement_image_id);
        trackAnnouncement(response.announcementID);
        trackAnnouncement(response.announcementID);
      },
    );
    it('should successfully update drawer announcement to modal announcement', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test DRAWER announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Test MODAL announcement', AnnouncementType.MODAL);
      mEditReq.type = 'modal' as AnnouncementType;
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response1.announcementID);
    });
    it('should successfully update modal announcement to drawer announcement', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test MODAL announcement', AnnouncementType.MODAL);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Test DRAWER announcement', AnnouncementType.DRAWER);
      mEditReq.type = 'drawer' as AnnouncementType;
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);
      trackAnnouncement(response1.announcementID);
    });
    it('should successfully update modal announcement to active embed announcement with another embed inactive announcement existing', async () => {
      const mCreateReq0 = buildCreateAnnouncementRequest(false, 'Test original EMBED announcement', AnnouncementType.EMBED);
      mCreateReq0.startDate = buildOverlappingTimeSpanTest(mCreateReq0?.startDate, -12);
      mCreateReq0.endDate = buildOverlappingTimeSpanTest(mCreateReq0?.endDate, -12);

      mockVerify();
      const mCreateRes0 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq0)
        .expect(200);
      const response0: CreateAnnouncementResponseInterface = mCreateRes0.body;

      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test MODAL announcement', AnnouncementType.MODAL);

      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const responsseAnnouncementImage = await buildAnnouncementImage(response1.announcementID);

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Test EMBED announcement', AnnouncementType.EMBED);
      mEditReq.type = 'embed' as AnnouncementType;
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);

      await removeAnnouncementImage(responsseAnnouncementImage.announcement_image_id);
      trackAnnouncement(response0.announcementID);
      trackAnnouncement(response1.announcementID);
    });
    it('should successfully update drawer announcement to active embed announcement with another embed inactive announcement existing', async () => {
      const mCreateReq0 = buildCreateAnnouncementRequest(false, 'Test original EMBED announcement', AnnouncementType.EMBED);
      mCreateReq0.startDate = buildOverlappingTimeSpanTest(mCreateReq0?.startDate, -12);
      mCreateReq0.endDate = buildOverlappingTimeSpanTest(mCreateReq0?.endDate, -12);

      mockVerify();
      const mCreateRes0 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq0)
        .expect(200);
      const response0: CreateAnnouncementResponseInterface = mCreateRes0.body;

      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test MODAL announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;
      const responsseAnnouncementImage = await buildAnnouncementImage(response1.announcementID);

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Test EMBED announcement', AnnouncementType.EMBED);
      mEditReq.type = 'embed' as AnnouncementType;
      const mEditRes = await request(app.getServer())
        .put('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mEditReq)
        .expect(200);

      expect(mEditRes.body.active).toEqual(true);

      await removeAnnouncementImage(responsseAnnouncementImage.announcement_image_id);
      trackAnnouncement(response0.announcementID);
      trackAnnouncement(response1.announcementID);
    });
    it('should throw 409 if drawer announcement has overlapping time span with existing drawer announcement type', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test Drawer announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer announcement 2', AnnouncementType.DRAWER);
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);

      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if drawer announcement has overlapping time span with existing modal announcement type', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test Embed announcement', AnnouncementType.MODAL);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer announcement', AnnouncementType.DRAWER);
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);

      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if modal announcement has overlapping time span with existing drawer announcement type', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test Embed announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Drawer announcement', AnnouncementType.MODAL);
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);

      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if modal announcement has start time edited to overlap with existing modal announcement time span ', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal announcement');
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if modal announcement has end time edited to overlap with existing modal announcement time span ', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal announcement');
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if modal announcement has start and end time edited to be within existing modal announcement time span ', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal announcement');
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if modal announcement has start and end time edited to overlap with existing modal announcement time span ', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal announcement');
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mockVerify();
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, null);
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should return 400 Bad Request if provided end date is prior to start date when updating announcement', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const date = getCurrentTimeForTimeZone('en-US', EST_TIMEZONE);
      const month = date.getMonth();
      date.setMonth(month - 1);
      const mReq = {
        announcementID: response.announcementID,
        name: 'Test',
        title: 'Title',
        description: 'Test description',
        startDate: getCurrentTimeForTimeZone('en-US', EST_TIMEZONE).toISOString().replace('Z', ''),
        endDate: date.toISOString().replace('Z', ''),
      } as EditAnnouncementRequestInterface;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mReq).expect(400);
      trackAnnouncement(response.announcementID);
    });
    it('should return 409 Duplicate Resource if provided name already exists for the restaurant provided', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mCreateReq2 = buildCreateAnnouncementRequest(true);
      mCreateReq2.startDate = buildOverlappingTimeSpanTest(mCreateReq2?.startDate, 12);
      mCreateReq2.endDate = buildOverlappingTimeSpanTest(mCreateReq2?.endDate, 12);

      mCreateReq2.name = 'Test Name 2';

      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);
      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      const mEditReq = buildEditAnnouncementRequest(response2.announcementID, true, mCreateReq1.name);

      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);
      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should return 400 if announcement type is passed in as a number when it needs to be either "modal", "drawer", or "announcement"', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'Name Change');
      mEditReq.type = 1 as unknown as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(400);

      trackAnnouncement(response.announcementID);
    });
    it('should return 400 if announcement type is passed in as a string that is not either "modal", "drawer", or "announcement"', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'Name Change');
      mEditReq.type = 'dummy' as unknown as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(400);

      trackAnnouncement(response.announcementID);
    });
    it('should return 400 if announcement type is changed from a drawer to embed announcement but announcement has no existing image', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true, 'Test', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'Name Change', AnnouncementType.EMBED);
      mEditReq.type = 'embed' as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(400);

      trackAnnouncement(response.announcementID);
    });
    it('should return 400 if announcement type is changed from a modal to embed announcement but announcement has no existing image', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true, 'Test', AnnouncementType.MODAL);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditReq = buildEditAnnouncementRequest(response.announcementID, true, 'Name Change', AnnouncementType.EMBED);
      mEditReq.type = 'embed' as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(400);

      trackAnnouncement(response.announcementID);
    });
    it('should return 409 if announcement type is changed from a drawer to active embed announcement but there is already an active embed announcment', async () => {
      const mCreateReq0 = buildCreateAnnouncementRequest(true, 'Test 0', AnnouncementType.EMBED);

      mockVerify();
      const mCreateRes0 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq0)
        .expect(200);
      const response0: CreateAnnouncementResponseInterface = mCreateRes0.body;

      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test 1', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const responsseAnnouncementImage = await buildAnnouncementImage(response1.announcementID);

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Name Change', AnnouncementType.EMBED);
      mEditReq.type = 'embed' as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      await removeAnnouncementImage(responsseAnnouncementImage.announcement_image_id);
      trackAnnouncement(response0.announcementID);
      trackAnnouncement(response1.announcementID);
    });
    it('should return 409 if announcement type is changed from a modal to active embed announcement but there is already an active embed announcment', async () => {
      const mCreateReq0 = buildCreateAnnouncementRequest(true, 'Test 0', AnnouncementType.EMBED);
      mockVerify();
      const mCreateRes0 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq0)
        .expect(200);
      const response0: CreateAnnouncementResponseInterface = mCreateRes0.body;

      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test 1', AnnouncementType.MODAL);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const responsseAnnouncementImage = await buildAnnouncementImage(response1.announcementID);

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Name Change', AnnouncementType.EMBED);
      mEditReq.type = 'embed' as AnnouncementType;

      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      await removeAnnouncementImage(responsseAnnouncementImage.announcement_image_id);
      trackAnnouncement(response0.announcementID);
      trackAnnouncement(response1.announcementID);
    });
    it('should return 409 if announcement type is changed from a embed to active drawer announcement but there is already an active drawer announcment', async () => {
      const mCreateReq0 = buildCreateAnnouncementRequest(true, 'Test 0', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes0 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq0)
        .expect(200);
      const response0: CreateAnnouncementResponseInterface = mCreateRes0.body;

      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test 1', AnnouncementType.EMBED);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Name Change', AnnouncementType.DRAWER);
      mEditReq.type = 'drawer' as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response0.announcementID);
      trackAnnouncement(response1.announcementID);
    });
    it('should return 409 if announcement type is changed from an embed to active modal announcement but there is already an active modal announcment', async () => {
      const mCreateReq0 = buildCreateAnnouncementRequest(true, 'Test 0', AnnouncementType.MODAL);
      mockVerify();
      const mCreateRes0 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq0)
        .expect(200);
      const response0: CreateAnnouncementResponseInterface = mCreateRes0.body;

      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test 1', AnnouncementType.EMBED);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);
      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      const mEditReq = buildEditAnnouncementRequest(response1.announcementID, true, 'Name Change', AnnouncementType.MODAL);
      mEditReq.type = 'modal' as AnnouncementType;
      await request(app.getServer()).put('/announcement').set('Authorization', 'token').set('restaurantID', '1').send(mEditReq).expect(409);

      trackAnnouncement(response0.announcementID);
      trackAnnouncement(response1.announcementID);
    });
  });
  describe('PUT /announcement/hide', () => {
    it('should successfully hide announcement and return inactive', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditRes = await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response.announcementID,
          hide: true,
        })
        .expect(200);

      expect(mEditRes.body.active).toEqual(false);
      trackAnnouncement(response.announcementID);
    });
    it('should successfully show a hidden announcement and return active if current date is within timespan', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditRes1 = await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response.announcementID,
          hide: true,
        })
        .expect(200);

      expect(mEditRes1.body.active).toEqual(false);

      const mEditRes2 = await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response.announcementID,
          hide: false,
        })
        .expect(200);

      expect(mEditRes2.body.active).toEqual(true);

      trackAnnouncement(response.announcementID);
    });
    it('should successfully show a hidden announcement and return inactive if current date is outside timespan', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(false);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const mEditRes1 = await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response.announcementID,
          hide: true,
        })
        .expect(200);

      expect(mEditRes1.body.active).toEqual(false);

      const mEditRes2 = await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response.announcementID,
          hide: false,
        })
        .expect(200);

      expect(mEditRes2.body.active).toEqual(false);

      trackAnnouncement(response.announcementID);
    });
    it('should throw 409 if modal announcement is shown and another modal announcement already exists and has same time span', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);

      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: true,
        })
        .expect(200);

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal Announcement');
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);

      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: false,
        })
        .expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if drawer announcement is shown and another drawer announcement already exists and has same time span', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Drawer announcement 1', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);

      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: true,
        })
        .expect(200);

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Drawer Announcement', AnnouncementType.DRAWER);
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);

      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: false,
        })
        .expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if drawer announcement is shown and another modal announcement already exists and has same time span', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true, 'Test Drawer Announcement', AnnouncementType.DRAWER);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);

      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: true,
        })
        .expect(200);

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Modal Announcement');
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);

      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: false,
        })
        .expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should throw 409 if modal announcement is shown and another drawer announcement already exists and has same time span', async () => {
      const mCreateReq1 = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq1)
        .expect(200);

      const response1: CreateAnnouncementResponseInterface = mCreateRes1.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: true,
        })
        .expect(200);

      const mCreateReq2 = buildCreateAnnouncementRequest(true, 'Test Second Modal Announcement', AnnouncementType.DRAWER);
      const mCreateRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq2)
        .expect(200);

      const response2: CreateAnnouncementResponseInterface = mCreateRes2.body;

      await request(app.getServer())
        .put('/announcement/hide')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID: response1.announcementID,
          hide: false,
        })
        .expect(409);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
  });
  describe('POST /announcements/media', () => {
    it('should successfully link announcement and media', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;

      const announcementID = response.announcementID;
      trackAnnouncement(announcementID);
      mockVerify();
      await request(app.getServer())
        .post('/announcements/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID,
          mediaIDs: [3],
        })
        .expect(200);
    });
    it('should successfully remove media for announcements', async () => {
      const mCreateReq = buildCreateAnnouncementRequest(true);
      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mCreateReq)
        .expect(200);
      const response: CreateAnnouncementResponseInterface = mCreateRes.body;
      const announcementID = response.announcementID;
      trackAnnouncement(announcementID);

      mockVerify();
      await request(app.getServer())
        .post('/announcements/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID,
          mediaIDs: [3],
        })
        .expect(200);

      await request(app.getServer())
        .post('/announcements/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          announcementID,
          mediaIDs: [],
        })
        .expect(200);
    });
  });
  describe('GET /announcements', () => {
    it('should successfully get 1 active modal announcement for a restaurant and 1 inactive modal announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true);
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test Name 3');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);

      const mRes3 = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      const response2: CreateAnnouncementResponseInterface = mRes2.body;
      const response3: GetAnnouncementsResponseInterface[] = mRes3.body;
      const firstCreatedAnnouncement: GetAnnouncementsResponseInterface = response3.find(
        announcement => announcement.announcementID === response1.announcementID,
      );
      response3.splice(response3.findIndex(announcement => announcement.announcementID === response1.announcementID));

      assertAnnouncementGetResponse(firstCreatedAnnouncement, true, false, response3);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully get modal inactive announcements for a restaurant', async () => {
      const mReq1 = buildCreateAnnouncementRequest(false);
      const mReq2 = buildCreateAnnouncementRequest(false, 'Test Name 3');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);

      const mRes3 = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      const response2: CreateAnnouncementResponseInterface = mRes2.body;
      const response3: GetAnnouncementsResponseInterface[] = mRes3.body;
      const firstCreatedAnnouncement: GetAnnouncementsResponseInterface = response3.find(
        announcement => announcement.announcementID === response1.announcementID,
      );
      response3.splice(response3.findIndex(announcement => announcement.announcementID === response1.announcementID));

      assertAnnouncementGetResponse(firstCreatedAnnouncement, false, false, response3);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully get 1 active embed announcement for a restaurant (including empty string title and description announcement) and 1 inactive embed announcement', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test Name ', AnnouncementType.EMBED);
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test Name 2', AnnouncementType.EMBED);
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      delete mReq2.title;
      delete mReq2.description; // empty title and description

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);

      const mRes3 = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      const response2: CreateAnnouncementResponseInterface = mRes2.body;
      const response3: GetAnnouncementsResponseInterface[] = mRes3.body;
      const firstCreatedAnnouncement: GetAnnouncementsResponseInterface = response3.find(
        announcement => announcement.announcementID === response1.announcementID,
      );
      response3.splice(response3.findIndex(announcement => announcement.announcementID === response1.announcementID));

      assertAnnouncementGetResponse(firstCreatedAnnouncement, true, false, response3);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully get embed inactive announcements for a restaurant', async () => {
      const mReq1 = buildCreateAnnouncementRequest(false);
      const mReq2 = buildCreateAnnouncementRequest(false, 'Test Name 3');
      mReq2.startDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);
      mReq2.endDate = buildOverlappingTimeSpanTest(mReq2?.startDate, 12);

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);

      const mRes3 = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      const response2: CreateAnnouncementResponseInterface = mRes2.body;
      const response3: GetAnnouncementsResponseInterface[] = mRes3.body;
      const firstCreatedAnnouncement: GetAnnouncementsResponseInterface = response3.find(
        announcement => announcement.announcementID === response1.announcementID,
      );
      response3.splice(response3.findIndex(announcement => announcement.announcementID === response1.announcementID));

      assertAnnouncementGetResponse(firstCreatedAnnouncement, false, false, response3);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully get 1 active modal announcement and 1 active embed announcement for a restaurant', async () => {
      const mReq1 = buildCreateAnnouncementRequest(true, 'Test Name');
      const mReq2 = buildCreateAnnouncementRequest(true, 'Test Name 2', AnnouncementType.EMBED);
      delete mReq2.title;
      delete mReq2.description; // empty title and description

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);

      const mRes3 = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      const response2: CreateAnnouncementResponseInterface = mRes2.body;
      const response3: GetAnnouncementsResponseInterface[] = mRes3.body;
      const firstCreatedAnnouncement: GetAnnouncementsResponseInterface = response3.find(
        announcement => announcement.announcementID === response1.announcementID,
      );
      response3.splice(response3.findIndex(announcement => announcement.announcementID === response1.announcementID));

      assertAnnouncementGetResponse(firstCreatedAnnouncement, true, false, response3);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully get 1 inactive modal announcement and 1 inactive embed announcement for a restaurant', async () => {
      const mReq1 = buildCreateAnnouncementRequest(false, 'Test Name');
      const mReq2 = buildCreateAnnouncementRequest(false, 'Test Name 2', AnnouncementType.EMBED);
      delete mReq2.title;
      delete mReq2.description; // empty title and description

      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq1)
        .expect(200);
      const mRes2 = await request(app.getServer())
        .post('/announcement')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(mReq2)
        .expect(200);

      const mRes3 = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response1: CreateAnnouncementResponseInterface = mRes1.body;
      const response2: CreateAnnouncementResponseInterface = mRes2.body;
      const response3: GetAnnouncementsResponseInterface[] = mRes3.body;
      const firstCreatedAnnouncement: GetAnnouncementsResponseInterface = response3.find(
        announcement => announcement.announcementID === response1.announcementID,
      );
      response3.splice(response3.findIndex(announcement => announcement.announcementID === response1.announcementID));

      assertAnnouncementGetResponse(firstCreatedAnnouncement, false, false, response3);

      trackAnnouncement(response1.announcementID);
      trackAnnouncement(response2.announcementID);
    });
    it('should successfully get empty array of announcements for a restaurant with no announcements', async () => {
      mockVerify();

      const mRes = await request(app.getServer()).get('/announcements').set('Authorization', 'token').set('restaurantID', '1').expect(200);

      const response: GetAnnouncementsResponseInterface[] = mRes.body;

      expect(response).toEqual([]);
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

// Cleanup helper functions
const removeAnnouncement = async (announcementID: number): Promise<void> => {
  try {
    const repository = await ormConnection();
    await repository.delete(AnnouncementImageEntity, { announcement_id: announcementID });
    await repository.delete(AnnouncementEntity, { announcement_id: announcementID });
  } catch (err) {
    // Ignore errors - announcement might not exist
  }
};

const cleanupTestAnnouncements = async (): Promise<void> => {
  try {
    const repository = await ormConnection();
    // Clean up announcements for test restaurants (1 and 8)
    const testAnnouncements = await repository
      .createQueryBuilder(AnnouncementEntity, 'announcement')
      .where('announcement.restaurant_id IN (:...restaurantIDs)', { restaurantIDs: [1, 8] })
      .getMany();

    for (const announcement of testAnnouncements) {
      if (announcement.announcement_id) {
        await removeAnnouncement(announcement.announcement_id);
      }
    }
  } catch (err) {
    // Ignore cleanup errors
  }
};

const removeAnnouncementImage = async (announcementImageID: number) => {
  const repository = await ormConnection();
  await repository.delete(AnnouncementImageEntity, announcementImageID);
};

const buildAnnouncementImage = async (announcementID: number): Promise<AnnouncementImageEntity> => {
  const repository = await ormConnection();
  return (await repository.insert(AnnouncementImageEntity, { announcement_id: announcementID, image_url: 'test.jpeg' })).raw[0];
};

/**
 * bypass authorization layer
 */
const mockVerify = (managerID = 999) => {
  const decoded = {
    managerID: managerID,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValue(true);
};
