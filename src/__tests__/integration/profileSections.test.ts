import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ormConnection } from '@utils/dbUtils';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { CreateProfileSectionRequest, ProfileSectionInterface, ProfileSectionWithCardMediaInterface } from '@interfaces/profileSections.interface';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { MediaEntity } from '@/entities/media.entity';
import { MediaType } from '@/enums/mediaType';
import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';
import { CreateProfileSectionCardsDto, EditProfileSectionCardsDto, LinkRestaurantProfileSectionMediaDto } from '@/dtos/profileSections.dto';
import { ProfileSectionCardResponseInterface, RestaurantProfileSectionCardsInterface } from '@/interfaces/profileCards.interface';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';
import { LinkMediaToProfileCardDto } from '@/dtos/profileCardMedia.dto';

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

const mockAuthService = new AuthService(new UsersModel());

describe('profile sections API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  const assertCreateProfilePageSectionResponse = (response: ProfileSectionInterface) => {
    const expectedResponse = {
      sectionID: expect.any(Number),
      name: expect.any(String),
      title: expect.any(String),
      content: expect.any(String),
      urlPath: expect.any(String),
      subNav: expect.any(String),
      isHidden: expect.any(Boolean),
    };
    expect(response).toMatchObject(expectedResponse);
  };

  describe('POST /profileSections', () => {
    it.each([
      {
        pageID: 1,
        name: 'profile section of type copy',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.COPY,
        urlPath: 'copy-path',
        subNav: 'Copy Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type media_gallery',
        title: 'Media Gallery Profile Section',
        template: SectionTemplates.MEDIA_GALLERY,
        urlPath: 'media-gallery-path',
        subNav: 'Media Gallery Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type content_cards',
        title: 'Content Cards Profile Section',
        template: SectionTemplates.CONTENT_CARDS,
        urlPath: 'content-cards-path',
        subNav: 'Content Cards Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type interactive_content_cards',
        title: 'Interactive Content Cards Profile Section',
        content: 'Interactive Content Cards Content',
        template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
        urlPath: 'interactive-content-cards-path',
        subNav: 'Interactive Content Cards Nav',
        isHidden: false,
      },
    ])('should successfully create $name', async (req: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;
      assertCreateProfilePageSectionResponse(response);
      await removeProfileSection(response.sectionID);
    });
    it.each([
      [
        'name already exists for a single restaurant profile page while creating profile section',
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          isHidden: false,
        },
      ],
      [
        'url path already exists for restaurant page while creating profile page',
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        {
          pageID: 1,
          name: 'valid name',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav 2',
          isHidden: false,
        },
      ],
      [
        'sub-navigation already exists for restaurant page while creating profile page',
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        {
          pageID: 1,
          name: 'valid name',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path-2',
          subNav: 'Copy Nav',
          isHidden: false,
        },
      ],
    ])('should throw 409 if %s', async (name: string, req1: CreateProfileSectionRequest, req2: CreateProfileSectionRequest) => {
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response1: ProfileSectionInterface = mRes1.body;

      await request(app.getServer()).post('/profileSections').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(409);

      await removeProfileSection(response1.sectionID);
    });
    it.each([
      {
        pageID: 1,
        name: 'urlPath for profile section is not in kebab case',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.COPY,
        urlPath: 'url path',
        subNav: 'Copy Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'subNav is provided without the urlPath dependency',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.COPY,
        subNav: 'Copy Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section has incorrect template',
        title: 'Fake Template Profile Section',
        template: 'fake template',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'copy profile section has no content',
        title: 'Copy Profile Section',
        template: SectionTemplates.COPY,
        isHidden: false,
      },
    ])('should return 400 Bad Request if $name', async (req: CreateProfileSectionRequest) => {
      mockVerify();
      await request(app.getServer()).post('/profileSections').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /profileSections', () => {
    it.each([
      {
        name: 'profile section of type copy',
        createReq: {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        editReq: {
          sectionID: -1,
          name: 'edited profile section of type copy',
          title: 'Edited Copy Profile Section',
          content: 'Edited Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'edited-copy-path',
          subNav: 'Edited Copy Nav',
          isHidden: false,
        },
      },
      {
        name: 'profile section of type media_gallery',
        createReq: {
          pageID: 1,
          name: 'profile section of type media_gallery',
          title: 'Media Gallery Profile Section',
          template: SectionTemplates.MEDIA_GALLERY,
          urlPath: 'media-gallery-path',
          subNav: 'Media Gallery Nav',
          isHidden: false,
        },
        editReq: {
          sectionID: -1,
          name: 'edited profile section of type media_gallery',
          title: 'Edited Media Gallery Profile Section',
          template: SectionTemplates.MEDIA_GALLERY,
          urlPath: 'edited-media-gallery-path',
          subNav: 'Edited Media Gallery Nav',
          isHidden: false,
        },
      },
      {
        name: 'profile section of type content_cards',
        createReq: {
          pageID: 1,
          name: 'profile section of type content_cards',
          title: 'Content Cards Profile Section',
          template: SectionTemplates.CONTENT_CARDS,
          urlPath: 'content-cards-path',
          subNav: 'Content Cards Nav',
          isHidden: false,
        },
        editReq: {
          sectionID: -1,
          name: 'edited profile section of type content_cards',
          title: 'Edited Content Cards Profile Section',
          template: SectionTemplates.CONTENT_CARDS,
          urlPath: 'edited-content-cards-path',
          subNav: 'Edited Content Cards Nav',
          isHidden: false,
        },
      },
      {
        name: 'profile section of type interactive_content_cards',
        createReq: {
          pageID: 1,
          name: 'profile section of type interactive_content_cards',
          title: 'Interactive Content Cards Profile Section',
          content: 'Interactive Content Cards Content',
          template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
          urlPath: 'interactive-content-cards-path',
          subNav: 'Interactive Content Cards Nav',
          isHidden: false,
        },
        editReq: {
          sectionID: -1,
          name: 'edited profile section of type interactive_content_cards',
          title: 'edited Interactive Content Cards Profile Section',
          content: 'edited Interactive Content Cards Content',
          template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
          urlPath: 'edited-interactive-content-cards-path',
          subNav: 'Edited Interactive Content Cards Nav',
          isHidden: false,
        },
      },
    ])(
      'should successfully update $name',
      async ({ createReq, editReq }: { name: string; createReq: CreateProfileSectionRequest; editReq: ProfileSectionInterface }) => {
        mockVerify();

        const mRes = await request(app.getServer())
          .post('/profileSections')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(createReq)
          .expect(200);
        const response: ProfileSectionInterface = mRes.body;

        editReq.sectionID = response.sectionID;

        mockVerify();
        await request(app.getServer()).put('/profileSections').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);

        await removeProfileSection(response.sectionID);
      },
    );
    it.each([
      [
        'name already exists for a single restaurant profile page while editing profile section',
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        {
          pageID: 1,
          name: 'Unique profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          isHidden: false,
        },
        {
          sectionID: -1,
          name: 'profile section of type copy',
          template: SectionTemplates.COPY,
          isHidden: false,
        },
      ],
      [
        'url path already exists for restaurant page while editing profile page',
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        {
          pageID: 1,
          name: 'valid name',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'unique-copy-path',
          subNav: 'Copy Nav 2',
          isHidden: false,
        },
        {
          sectionID: -1,
          urlPath: 'copy-path',
          template: SectionTemplates.COPY,
          isHidden: false,
        },
      ],
      [
        'sub-navigation already exists for restaurant page while creating profile page',
        {
          pageID: 1,
          name: 'profile section of type copy',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Nav',
          isHidden: false,
        },
        {
          pageID: 1,
          name: 'valid name',
          title: 'Copy Profile Section',
          content: 'Copy Content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path-2',
          subNav: 'Unique Copy Nav',
          isHidden: false,
        },
        {
          sectionID: -1,
          subNav: 'Copy Nav',
          template: SectionTemplates.COPY,
          isHidden: false,
        },
      ],
    ])(
      'should throw 409 if %s',
      async (name: string, req1: CreateProfileSectionRequest, req2: CreateProfileSectionRequest, editReq: ProfileSectionInterface) => {
        mockVerify();
        const mRes1 = await request(app.getServer())
          .post('/profileSections')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(req1)
          .expect(200);
        const response1: ProfileSectionInterface = mRes1.body;

        mockVerify();
        const mRes2 = await request(app.getServer())
          .post('/profileSections')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(req2)
          .expect(200);
        const response2: ProfileSectionInterface = mRes2.body;

        editReq.sectionID = response2.sectionID;

        mockVerify();
        await request(app.getServer()).put('/profileSections').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(409);

        await removeProfileSection(response1.sectionID);
        await removeProfileSection(response2.sectionID);
      },
    );
  });
  describe('DELETE /profileSections/:sectionID', () => {
    it.each([
      {
        pageID: 1,
        name: 'profile section of type copy',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.COPY,
        urlPath: 'copy-path',
        subNav: 'Copy Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type media_gallery',
        title: 'Media Gallery Profile Section',
        template: SectionTemplates.MEDIA_GALLERY,
        urlPath: 'media-gallery-path',
        subNav: 'Media Gallery Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type content_cards',
        title: 'Content Cards Profile Section',
        template: SectionTemplates.CONTENT_CARDS,
        urlPath: 'content-cards-path',
        subNav: 'Content Cards Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type interactive_content_cards',
        title: 'Interactive Content Cards Profile Section',
        content: 'Interactive Content Cards Content',
        template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
        urlPath: 'interactive-content-cards-path',
        subNav: 'Interactive Content Cards Nav',
        isHidden: false,
      },
    ])('should successfully create $name', async (req: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;
      const sectionID = response?.sectionID;

      mockVerify();
      await request(app.getServer()).delete(`/profileSections/${sectionID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
    it('should throw 404 if section is not provided', async () => {
      mockVerify();
      await request(app.getServer()).delete(`/profileSections/`).set('Authorization', 'token').set('restaurantID', '1').expect(404);
    });
    it('should throw 404 if profile section doesnt exist', async () => {
      const SECTION_ID_NOT_FOUND = 9999999;
      mockVerify();
      await request(app.getServer())
        .delete(`/profileSections/${SECTION_ID_NOT_FOUND}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(404);
    });
  });
  describe('POST /profileSections/media', () => {
    const RESTAURANT_ID = 1;
    const PROFILE_SECTION_REQ = {
      pageID: 1,
      name: 'profile section of type media gallery',
      title: 'Profile Section',
      content: 'Content',
      template: SectionTemplates.MEDIA_GALLERY,
      urlPath: 'media-path',
      subNav: 'Media Nav',
      isHidden: false,
    };
    it('should successfully link media to a restaurant profile section', async () => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;

      // we cant hit endpoint since its form-data... well we can, but its tricky and also would need to send up image jpeg files
      // easier to just direct write to db and remove afterwards
      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg', 'image2.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse1[1].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(200);

      await removeProfileSection(response.sectionID, req2.mediaIDs);
    });
    it('should successfully remove media for a restaurant profile section', async () => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg', 'image2.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse1[1].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(200);

      const req3: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response.sectionID,
        mediaIDs: [], // remove all media of page section
      };

      // remove media of page section when there are media of page section currently existing
      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req3).expect(200);

      // remove media of page section when there are NO media of page section currently existing
      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req3).expect(200);

      await removeProfileSection(response.sectionID, req2.mediaIDs);
    });
    it.each([
      // can add new templates here that allow media
      {
        pageID: 1,
        name: 'profile section of type media gallery',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.MEDIA_GALLERY,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
    ])('should successfully link media to a restaurant profile section with a $name', async (req1: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes1 = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response1: ProfileSectionInterface = mRes1.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg', 'image2.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response1.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse1[1].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(200);

      await removeProfileSection(response1.sectionID, req2.mediaIDs);
    });
    it.each([
      // can add new templates here that dont allow media
      {
        pageID: 1,
        name: 'template is type COPY and trying to upload media',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.COPY,
        urlPath: 'url-path',
        subNav: 'Copy Nav',
        isHidden: false,
      },
    ])('should throw 400 Bad Request if $name', async (req: CreateProfileSectionRequest) => {
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);
      const response1: ProfileSectionInterface = mRes1.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg', 'image2.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response1.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse1[1].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(400);

      await removeProfileSection(response1.sectionID, req2.mediaIDs);
    });
    it('should throw 401 if media is attempting to be linked to a page section of a different restaurant', async () => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg', 'image2.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse1[1].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '6').send(req2).expect(401);

      await removeProfileSection(response.sectionID, req2.mediaIDs);
    });
    it('should throw 400 if a mediaID doesnt exist in database', async () => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, 99999],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(400);

      await removeProfileSection(response.sectionID, req2.mediaIDs);
    });
    it('should throw 400 if some media is exists for page section restaurant, but other media does not exist for page section restaurant', async () => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response1: ProfileSectionInterface = mRes.body;
      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);

      const mediaResponse2 = await createImageMediaEntities(['image2.jpeg'], 6);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response1.sectionID,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse2[0].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(400);

      await removeProfileSection(response1.sectionID, req2.mediaIDs);
    });
    it('should throw 404 if page section doesnt exist for media to link to', async () => {
      mockVerify();

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg', 'image2.jpeg'], RESTAURANT_ID);

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: 999999,
        mediaIDs: [mediaResponse1[0].media_id, mediaResponse1[1].media_id],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(404);

      await removeImageMediaEntities(req2.mediaIDs);
    });
    it('should throw 400 if mediaIDs are larger than 15 images in request', async () => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;

      const mediaResponse1 = await createImageMediaEntities(
        ['img1', 'img2', 'img3', 'img4', 'img5', 'img6', 'img7', 'img8', 'img9', 'img10', 'img11', 'img12', 'img13', 'img14', 'img15', 'img16'],
        RESTAURANT_ID,
      );

      const req2: LinkRestaurantProfileSectionMediaDto = {
        sectionID: response.sectionID,
        mediaIDs: mediaResponse1.map(media => media.media_id),
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(400);

      await removeProfileSection(response.sectionID, req2.mediaIDs);
    });
    it('should throw 400 if some media if there are duplicates in mediaIDs', async () => {
      mockVerify();

      const req1: LinkRestaurantProfileSectionMediaDto = {
        sectionID: 1,
        mediaIDs: [1, 1],
      };

      await request(app.getServer()).put('/profileSections/media').set('Authorization', 'token').set('restaurantID', '1').send(req1).expect(400);
    });
  });

  describe('POST /profileSections/cards', () => {
    it.each([
      // can add new templates here that allow cards
      {
        pageID: 1,
        name: 'profile section of type content cards',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.CONTENT_CARDS,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type interactive content cards',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
    ])('should successfully create card for a profile section with template type $name', async (req1: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;
      const sectionID = response?.sectionID;

      const req2: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      mockVerify();
      await request(app.getServer()).post('/profileSections/cards').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(200);

      await removeProfileSection(response.sectionID);
    });
    it.each([
      // can add new templates here that dont allow cards
      {
        pageID: 1,
        name: 'template is type COPY and should fail to create card',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.COPY,
        urlPath: 'url-path',
        subNav: 'Copy Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'template is type MEDIA_GALLERY and should fail to create card ',
        title: 'Copy Profile Section',
        content: 'Copy Content',
        template: SectionTemplates.MEDIA_GALLERY,
        urlPath: 'url-path',
        subNav: 'Copy Nav',
        isHidden: false,
      },
    ])('should throw 400 and not create card for a profile section due to template type $name', async (req: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;
      const sectionID = response?.sectionID;

      const req2: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      await request(app.getServer()).post('/profileSections/cards').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(400);

      await removeProfileSection(response.sectionID);
    });
    it('should throw 404 if page section doesnt exist for card to be tied to', async () => {
      mockVerify();

      const req2: CreateProfileSectionCardsDto = {
        sectionID: 9999999,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      await request(app.getServer()).post('/profileSections/cards').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(404);
    });
  });
  describe('PUT /profileSections/cards', () => {
    it.each([
      // can add new templates here that allow cards
      {
        pageID: 1,
        name: 'profile section of type content cards and should edit card',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.CONTENT_CARDS,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type interactive content cards and should edit card',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
    ])('should successfully edit card for a profile section with template type $name', async (req1: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);

      const response: ProfileSectionInterface = mRes.body;
      const sectionID = response?.sectionID;

      // create card
      const req2: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };
      mockVerify();
      const res2 = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);
      const cardID = res2.body.cardID;

      // update card with normal values
      const UPDATE_CARD_REQ: EditProfileSectionCardsDto = {
        cardID: cardID,
        title: 'test title2',
        content: 'test content2',
        subtitle: 'test subtitle2',
        linkURL: 'test link2',
      };
      mockVerify();
      await request(app.getServer())
        .put('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(UPDATE_CARD_REQ)
        .expect(200);

      // send up no values for cards that are optional
      const EMPTY_CARD_REQ: Partial<EditProfileSectionCardsDto> = {
        cardID: cardID,
      };
      mockVerify();
      await request(app.getServer())
        .put('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(EMPTY_CARD_REQ)
        .expect(200);

      // remove card columns that dont require a value in database
      const REMOVE_CARD_COLUMNS_REQ: Partial<EditProfileSectionCardsDto> = {
        cardID: cardID,
        title: 'test title3',
      };
      mockVerify();
      await request(app.getServer())
        .put('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(REMOVE_CARD_COLUMNS_REQ)
        .expect(200);

      mockVerify();
      await removeProfileSection(response.sectionID);
    });
    it('should throw 404 if page section card doesnt exist', async () => {
      const UPDATE_CARD_REQ: EditProfileSectionCardsDto = {
        cardID: 9999999,
        title: 'test title2',
        content: 'test content2',
        subtitle: 'test subtitle2',
        linkURL: 'test link2',
      };
      mockVerify();
      await request(app.getServer())
        .put('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(UPDATE_CARD_REQ)
        .expect(404);
    });
  });

  describe('PUT /profileSections/cards/media', () => {
    const RESTAURANT_ID = 1;
    const PROFILE_SECTION_REQ = {
      pageID: 1,
      name: 'profile section of type content cards',
      title: 'Profile Section',
      content: 'Content',
      template: SectionTemplates.CONTENT_CARDS,
      urlPath: 'media-path',
      subNav: 'Media Nav',
      isHidden: false,
    };
    it('should successfully link media to a restaurant profile section card', async () => {
      mockVerify();

      const createSectionRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = createSectionRes.body;

      const createCardReq: CreateProfileSectionCardsDto = {
        sectionID: response.sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };
      mockVerify();
      const createCardRes = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createCardReq)
        .expect(200);
      const cardResponse: RestaurantProfileSectionCardsInterface = createCardRes.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);

      const linkMediaToCardReq: LinkMediaToProfileCardDto = {
        cardID: cardResponse.cardID,
        mediaID: mediaResponse1[0].media_id,
      };

      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(linkMediaToCardReq)
        .expect(200);

      await removeProfileSection(response.sectionID);
      await removeImageMediaEntities([mediaResponse1[0].media_id]);
    });

    it('should create section, card, media, and link media to a card, then remove media from card and add another media to card', async () => {
      mockVerify();

      const createSectionRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);
      const response: ProfileSectionInterface = createSectionRes.body;

      const createCardReq: CreateProfileSectionCardsDto = {
        sectionID: response.sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      mockVerify();
      const createCardRes = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createCardReq)
        .expect(200);
      const cardResponse: RestaurantProfileSectionCardsInterface = createCardRes.body;

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);

      const linkMediaToCardReq1: LinkMediaToProfileCardDto = {
        cardID: cardResponse.cardID,
        mediaID: mediaResponse1[0].media_id,
      };

      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(linkMediaToCardReq1)
        .expect(200);

      const mediaResponse2 = await createImageMediaEntities(['image2.jpeg'], RESTAURANT_ID);

      const linkMediaToCardReq2: LinkMediaToProfileCardDto = {
        cardID: cardResponse.cardID,
        mediaID: mediaResponse2[0].media_id,
      };

      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(linkMediaToCardReq2)
        .expect(200);

      await removeProfileSection(response.sectionID);

      // remove both image entities
      await removeImageMediaEntities([mediaResponse1[0].media_id]);
      await removeImageMediaEntities([mediaResponse2[0].media_id]);
    });

    it('it should create section, card, media, and then tie media to card, and then remove media from card by not passing up mediaID', async () => {
      mockVerify();

      // Create a profile section
      const createSectionRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);

      const sectionID = createSectionRes.body.sectionID;

      // Create a profile section card
      const createCardReq: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      const createCardRes = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createCardReq)
        .expect(200);

      const cardID = createCardRes.body.cardID;

      // Link media to the card
      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);

      const req3: LinkMediaToProfileCardDto = {
        cardID,
        mediaID: mediaResponse1[0].media_id,
      };

      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req3)
        .expect(200);

      // Remove media from the card by not passing mediaID
      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ cardID }) // Pass only cardID without mediaID
        .expect(200);

      // Verify that the media is successfully removed from the card
      const updatedPageRes = await request(app.getServer())
        .get(`/profilePages/${1}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);

      // get the section we just created
      const receivedSection: ProfileSectionWithCardMediaInterface = updatedPageRes.body.profileSections.filter(
        section => section.sectionID === sectionID,
      );
      // get the card we just created
      const receivedCard: ProfileSectionCardResponseInterface = receivedSection[0].cards.filter(card => card.cardID === cardID);
      // get the media we just tied to card
      const receivedCardMedia = receivedCard[0].cardMedia.filter(media => media.mediaID === mediaResponse1[0].media_id);

      expect(receivedCardMedia).toHaveLength(0); // Ensure no media is linked to the card

      await removeProfileSection(sectionID);

      await removeImageMediaEntities([mediaResponse1[0].media_id]);
    });

    it('should create section, card, media, and then hit media endpoint but with no mediaID first time', async () => {
      mockVerify();

      // Create a profile section
      const createSectionRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(PROFILE_SECTION_REQ)
        .expect(200);

      const sectionID = createSectionRes.body.sectionID;

      // Create a profile section card
      const createCardReq: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      const createCardRes = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createCardReq)
        .expect(200);

      const cardID = createCardRes.body.cardID;

      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ cardID }) // Pass only cardID without mediaID
        .expect(200);

      // Verify that no media is linked to the card
      const updatedPageRes = await request(app.getServer())
        .get(`/profilePages/${1}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);

      // get the section we just created
      const receivedSection: ProfileSectionWithCardMediaInterface = updatedPageRes.body.profileSections.filter(
        section => section.sectionID === sectionID,
      );
      // get the card we just created
      const receivedCard: ProfileSectionCardResponseInterface = receivedSection[0].cards.filter(card => card.cardID === cardID);
      // get the media we just tied to card
      const receivedCardMedia = receivedCard[0].cardMedia;

      expect(receivedCardMedia).toHaveLength(0); // Ensure no media is linked to the card

      await removeProfileSection(sectionID);
    });

    it('should throw 404 if page section card doesnt exist for media to link to', async () => {
      mockVerify();

      const mediaResponse1 = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);

      const reqToLinkMedia: LinkMediaToProfileCardDto = {
        cardID: 9999999,
        mediaID: mediaResponse1[0].media_id,
      };

      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(reqToLinkMedia)
        .expect(404);

      await removeImageMediaEntities([mediaResponse1[0].media_id]);
    });
  });

  describe('DELETE /profileSections/cards/:cardID', () => {
    it.each([
      // can add new templates here that allow cards
      {
        pageID: 1,
        name: 'profile section of type content cards',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.CONTENT_CARDS,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
      {
        pageID: 1,
        name: 'profile section of type interactive content cards',
        title: 'Profile Section',
        content: 'Content',
        template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
        urlPath: 'media-path',
        subNav: 'Media Nav',
        isHidden: false,
      },
    ])('should successfully delete card for a profile section with template type $name', async (req1: CreateProfileSectionRequest) => {
      mockVerify();

      const mRes = await request(app.getServer())
        .post('/profileSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response: ProfileSectionInterface = mRes.body;
      const sectionID = response?.sectionID;

      const req2: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      };

      mockVerify();
      const mCreateRes = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);

      const createResponse: RestaurantProfileSectionCardsInterface = mCreateRes.body;
      const cardID = createResponse?.cardID;

      // to ensure that DELETE ON CASCADE db constraint will delete from this table.
      const repository = await ormConnection();
      repository.insert(ProfileCardsMediaEntity, {
        restaurantProfileSectionCardID: cardID,
        mediaID: 3,
      });

      mockVerify();
      await request(app.getServer()).delete(`/profileSections/cards/${cardID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);

      await removeProfileSection(response.sectionID);
    });
    it('should throw 400 if cardID is not provided', async () => {
      mockVerify();
      await request(app.getServer()).delete(`/profileSections/cards/`).set('Authorization', 'token').set('restaurantID', '1').expect(400);
    });
    it('should throw 404 if page section card doesnt exist', async () => {
      const CARD_ID_NOT_FOUND = 9999999;
      mockVerify();
      await request(app.getServer())
        .delete(`/profileSections/cards/${CARD_ID_NOT_FOUND}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(404);
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

const removeProfileSection = async (sectionID: number, mediaIDs?: number[]): Promise<void> => {
  const repository = await ormConnection();

  // first remove any media connected to page section (if any)
  if (mediaIDs?.length > 0) {
    // remove from restaurant_profile_media table
    await removeRestaurantProfileMediaEntitiesByMediaID(mediaIDs);

    // remove from media library
    await removeImageMediaEntities(mediaIDs);
  }

  // hard deleting a page section will delete cards automatically since it is DELETE ON CASCADE

  // then remove page section
  await repository.delete(ProfileSectionEntity, sectionID);
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

/**
 * create image in media library table
 */
const createImageMediaEntities = async (images: string[], restaurantID: number): Promise<MediaEntity[]> => {
  const repository = await ormConnection();
  const result: MediaEntity[] = [];
  for (const image of images) {
    result.push(await repository.save(MediaEntity, MediaEntity.createEntityFromRequest(image, restaurantID, MediaType.IMAGE)));
  }
  return result;
};

/**
 * delete image in media library table
 */
const removeImageMediaEntities = async (mediaIDs: number[]): Promise<void> => {
  const repository = await ormConnection();
  for (const id of mediaIDs) {
    await repository.delete(MediaEntity, id);
  }
};

/**
 * delete image in restaurant_profile_media table
 */
const removeRestaurantProfileMediaEntitiesByMediaID = async (mediaIDs: number[]): Promise<void> => {
  const repository = await ormConnection();
  for (const id of mediaIDs) {
    await repository.delete(RestaurantProfileMediaEntity, { mediaID: id });
  }
};
