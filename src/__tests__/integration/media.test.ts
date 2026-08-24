import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { MediaResponseInterface, CreateSignedURLResponse } from '@interfaces/mediaLibrary.interface';
import { MediaType } from '@enums/mediaType';
import jwt from 'jsonwebtoken';
import AuthService from '@services/auth.service';
import UsersModel from '@models/users.model';
import { MediaEntity } from '@/entities/media.entity';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import { checkFileExists } from '@/utils/GCP_bucket';
import { ormConnection } from '@/utils/dbUtils';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
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
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
    sign: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});

const mockAuthService = new AuthService(new UsersModel());

describe('media API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('GET /media', () => {
    const validateMedia = (media: MediaResponseInterface[]) => {
      media.forEach(val => {
        expect(typeof val.mediaID).toEqual('number');
        expect(typeof val.mediaUrl).toEqual('string');
        expect(typeof val.name).toEqual('string');
        expect(typeof val.mediaUrl).toEqual('string');
        expect(typeof val.type).toEqual('string');
        expect(Object.values(MediaType)).toContain(val.type);
        expect(typeof val.createdAt).toEqual('string');
      });
    };
    it('should return all media for a restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer()).get('/media').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      validateMedia(res.body);
    });
  });
  describe('DELETE /media/:mediaID', () => {
    const RESTAURANT_ID = 1;
    it('should soft delete media for a restaurant media library', async () => {
      // create a dummy image
      const uniqueMediaUrl = `test-${Date.now()}.jpeg`;
      const mediaDummy = new MediaEntity(uniqueMediaUrl, 1, RESTAURANT_ID, 'some_image', 1);
      const mediaEntityManager = new MediaLibraryModel();
      const media = await mediaEntityManager.insertMedia([mediaDummy]);
      const mediaID = media[0].media_id;

      mockVerify();
      await request(app.getServer()).delete(`/media/${mediaID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
    it('should not soft delete media for a restaurant media library if id doesnt exist', async () => {
      mockVerify();
      await request(app.getServer()).delete(`/media/:${99999}`).set('Authorization', 'token').set('restaurantID', '1').expect(401);
    });
  });
  describe('POST /media/videoSignedURL', () => {
    const EXT = 'mp4';
    const req = {
      extension: EXT,
    };

    const assertVideoSignedURLResponse = (res: CreateSignedURLResponse) => {
      expect(typeof res.signedURL).toEqual('string');
      expect(typeof res.fileName).toEqual('string');
      expect(typeof res.videoUUID).toEqual('string');
    };

    it('should generate video signed url for long form video upload', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/media/videoSignedURL')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);

      assertVideoSignedURLResponse(res.body);
    });
    it('should throw 400 Http Exception if extension type is invalid (not movie file extension)', async () => {
      mockVerify();

      await request(app.getServer())
        .post('/media/videoSignedURL')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ extension: 'foo' })
        .expect(400);
    });
  });
  describe('POST /media/linkLongFormVideoToMediaLibrary', () => {
    const req = {
      videoUUID: '0260f32b-eb9c-4f86-a0fd-e733045517c6.mp4', // hardcoded these for now since we want to check if file exists up on storage.  We could perhaps mock it
      originalFileName: 'testName',
    };
    const badReqFileDoesntExist = {
      videoUUID: 'dummy.mp4',
      originalFileName: 'testName',
    };
    const badExtensionReq = {
      videoUUID: 'dummy.blah',
      originalFileName: 'testName',
    };

    const assertMediaResponse = (media: MediaResponseInterface) => {
      expect(typeof media.mediaID).toEqual('number');
      expect(typeof media.mediaUrl).toEqual('string');
      expect(typeof media.type).toEqual('string');
      expect(Object.values(MediaType)).toContain(media.type);
      expect(typeof media.name).toEqual('string');
    };

    it('should link long form video to media library', async () => {
      (checkFileExists as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      mockVerify();

      const res = await request(app.getServer())
        .post('/media/linkLongFormVideoToMediaLibrary')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);

      assertMediaResponse(res.body);

      // cleanup
      mockVerify();
      await removeMedia(res.body.mediaID);
    });
    it('should throw 409 HttpException if media already exists in media library by media_url of a videoUUID value passed in request', async () => {
      (checkFileExists as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      mockVerify();

      const res1 = await request(app.getServer())
        .post('/media/linkLongFormVideoToMediaLibrary')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);

      assertMediaResponse(res1.body);

      mockVerify();

      await request(app.getServer())
        .post('/media/linkLongFormVideoToMediaLibrary')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(409);

      // cleanup
      await removeMedia(res1.body.mediaID);
    });
    it('should throw 404 HttpException if original media does not exist up on the GCP cloud storage', async () => {
      (checkFileExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);
      mockVerify();

      await request(app.getServer())
        .post('/media/linkLongFormVideoToMediaLibrary')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(badReqFileDoesntExist)
        .expect(404);
    });
    it('should throw 400 HttpException if videoUUID is an invalid extension (not mp4, mov, etc.)', async () => {
      mockVerify();

      await request(app.getServer())
        .post('/media/linkLongFormVideoToMediaLibrary')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(badExtensionReq)
        .expect(400);
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
 * clean up existing media
 */
const removeMedia = async (mediaID: number) => {
  const entityManager = await ormConnection();
  await entityManager.delete(MediaEntity, mediaID);
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
