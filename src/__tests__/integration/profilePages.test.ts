import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ormConnection } from '@utils/dbUtils';
import {
  CreateProfilePageRequestInterface,
  CreateProfilePageResponseInterface,
  EditProfilePageRequestInterface,
  GetProfilePageDetailsResponseInterface,
} from '@interfaces/profilePages.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { ProfileSectionInterface, ProfileSectionWithCardMediaInterface } from '@interfaces/profileSections.interface';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { MediaType } from '@/enums/mediaType';
import { ProfileSectionCardResponseInterface, RestaurantProfileSectionCardsInterface } from '@/interfaces/profileCards.interface';
import { MediaEntity } from '@/entities/media.entity';
import { CreateProfileSectionCardsDto } from '@/dtos/profileSections.dto';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';
import { MediaResponseInterface } from '@/interfaces/mediaLibrary.interface';
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

describe('profile pages API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  const SECTIONS: ProfileSectionInterface[] = [
    {
      name: 'Copy Name',
      title: 'Copy Title 1',
      content: 'Copy content',
      template: SectionTemplates.COPY.toLowerCase(),
      isHidden: false,
      urlPath: 'copy-path',
      subNav: 'Copy Link',
    },
    {
      name: 'Media Gallery Name',
      title: 'Media Gallery Title 2',
      template: SectionTemplates.MEDIA_GALLERY.toLowerCase(),
      isHidden: false,
    },
    {
      name: 'Section with Content Cards',
      title: 'Section Title',
      template: SectionTemplates.CONTENT_CARDS.toLowerCase(),
      isHidden: false,
    },
  ];
  const createPageRequestBuilder = (
    name: string,
    urlPath?: string,
    navLink?: string,
    isHidden = true,
    provideOptionals = false,
    profileSections?: ProfileSectionInterface[],
  ): CreateProfilePageRequestInterface => {
    const request = {
      name,
      seoTitle: 'Test SEO title',
      ...(provideOptionals && { seoDescription: 'Test SEO description' }),
      ...(urlPath && { urlPath }),
      ...(navLink && { navLink }),
      isHidden,
    } as CreateProfilePageRequestInterface;
    if (profileSections?.length > 0) {
      request.profileSections = profileSections;
    }

    return request;
  };
  const editPageRequestBuilder = (
    name?: string,
    urlPath?: string,
    navLink?: string,
    isHidden = false,
    seoTitle = 'Test SEO title',
    seoDescription = 'Test SEO description',
  ): EditProfilePageRequestInterface => {
    return {
      ...(name && { name }),
      ...(seoTitle && { seoTitle }),
      ...(seoDescription && { seoDescription }),
      ...(urlPath && { urlPath }),
      ...(navLink && { navLink }),
      isHidden,
    } as EditProfilePageRequestInterface;
  };
  const assertCreateProfilePageResponse = (response: CreateProfilePageResponseInterface) => {
    const expectedResponse = {
      pageID: expect.any(Number),
      name: expect.any(String),
      seoTitle: expect.any(String),
      seoDescription: expect.any(String),
      urlPath: expect.any(String),
      navLink: expect.any(String),
      isHidden: expect.any(Boolean),
      ...(response.profileSections.length > 0 && {
        profileSections: response.profileSections.map(() => ({
          sectionID: expect.any(Number),
          name: expect.any(String),
          title: expect.any(String),
          content: expect.any(String),
          urlPath: expect.any(String),
          subNav: expect.any(String),
          isHidden: expect.any(Boolean),
        })),
      }),
    };
    expect(response).toMatchObject(expectedResponse);
  };
  const assertGetProfilePageDetailsResponse = (response: GetProfilePageDetailsResponseInterface) => {
    expect(typeof response.pageID).toBe('number');
    expect(typeof response.name).toBe('string');
    expect(typeof response.seoTitle).toBe('string');
    expect(typeof response.seoDescription).toBe('string');
    expect(typeof response.urlPath).toBe('string');
    expect(typeof response.navLink).toBe('string');
    expect(typeof response.isHidden).toBe('boolean');

    expect(Array.isArray(response.profileSections)).toBe(true);
    expect(Array.isArray(response.profileSections[0].cards)).toBe(true);
    expect(Array.isArray(response.profileSections[0].media)).toBe(true);

    response.profileSections?.forEach((section: ProfileSectionWithCardMediaInterface) => {
      expect(typeof section.sectionID).toBe('number');
      expect(typeof section.name).toBe('string');
      expect(typeof section.title).toBe('string');
      expect(typeof section.content).toBe('string');
      expect(typeof section.template).toBe('string');
      expect(typeof section.urlPath).toBe('string');
      expect(typeof section.subNav).toBe('string');
      expect(typeof section.isHidden).toBe('boolean');

      section.cards?.forEach((card: ProfileSectionCardResponseInterface) => {
        expect(typeof card.cardID).toBe('number');
        expect(typeof card.title).toBe('string');
        expect(typeof card.content).toBe('string');
        expect(typeof card.subtitle).toBe('string');
        expect(typeof card.linkURL).toBe('string');
        expect(Array.isArray(card.cardMedia)).toBe(true);

        card.cardMedia?.forEach((cardMedia: MediaResponseInterface) => {
          expect(typeof cardMedia.mediaID).toBe('number');
          expect(typeof cardMedia.mediaUrl).toBe('string');
          expect(cardMedia.type).toMatch(new RegExp(`^(${MediaType.IMAGE}|${MediaType.VIDEO})$`));
        });
      });

      section.media?.forEach(media => {
        expect(typeof media.mediaID).toBe('number');
        expect(typeof media.mediaUrl).toBe('string');
        expect(media.type).toMatch(new RegExp(`^(${MediaType.IMAGE}|${MediaType.VIDEO})$`));
      });
    });
  };

  describe('POST /profilePages', () => {
    it.each([
      createPageRequestBuilder('profile page with required values'),
      createPageRequestBuilder('profile page with all values', 'test-path', 'Test Link', false, true),
      createPageRequestBuilder('profile page with multiple profile sections', 'test-path', 'Test Link', false, true, SECTIONS),
    ])('should successfully create $name', async (req: CreateProfilePageRequestInterface) => {
      mockVerify();

      const mRes = await request(app.getServer()).post('/profilePages').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const response: CreateProfilePageResponseInterface = mRes.body;
      assertCreateProfilePageResponse(response);
      await removeProfileSections(response.profileSections.map(section => section.sectionID));
      await removeProfilePage(response.pageID);
    });
    it.each([
      [
        'name already exists for restaurant while creating profile page',
        createPageRequestBuilder('profile page with duplicate name', null, null, false),
        createPageRequestBuilder('profile page with duplicate name', null, null, false),
      ],
      [
        'url path already exists for restaurant while creating profile page',
        createPageRequestBuilder('profile page with duplicate url path', 'test-path', 'Test Link', false),
        createPageRequestBuilder('second request', 'test-path', 'Test Link', false),
      ],
    ])('should throw 409 if %s', async (name: string, req1: CreateProfilePageRequestInterface, req2: CreateProfilePageRequestInterface) => {
      mockVerify();
      const mRes1 = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response1: CreateProfilePageResponseInterface = mRes1.body;

      await request(app.getServer()).post('/profilePages').set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(409);

      await removeProfilePage(response1.pageID);
    });
    it.each([
      createPageRequestBuilder('urlPath for profile page is not in kebab case', 'url path'),
      createPageRequestBuilder('navLink is provided without the urlPath dependency', null, 'Test Link'),
      createPageRequestBuilder('profile page with multiple profile sections has duplicate names', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[0], name: 'duplicate' },
        { ...SECTIONS[1], name: 'duplicate' },
      ]),
      createPageRequestBuilder('profile page with multiple profile sections has duplicate urlPaths', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[0], urlPath: 'duplicate-path' },
        { ...SECTIONS[1], urlPath: 'duplicate-path' },
      ]),
      createPageRequestBuilder('profile page with multiple profile sections has duplicate subNavs', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[0], urlPath: 'different-path-1', subNav: 'Duplicate Link' },
        { ...SECTIONS[1], urlPath: 'different-path-2', subNav: 'duplicate link' },
      ]),
      createPageRequestBuilder('profile page with profile section has urlPath not in kebab case', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[0], urlPath: 'url path' },
      ]),
      createPageRequestBuilder(
        'profile page with profile section has subNav provided without the urlPath dependency',
        'test-path',
        'Test Link',
        false,
        false,
        [{ ...SECTIONS[1], subNav: 'Nav Link' }],
      ),
      createPageRequestBuilder('profile page with profile section has incorrect template', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[1], template: 'fake template' },
      ]),
      createPageRequestBuilder('profile page with copy profile section has no content', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[0], content: null },
      ]),
    ])('should return 400 Bad Request if $name', async (req: CreateProfilePageRequestInterface) => {
      mockVerify();
      await request(app.getServer()).post('/profilePages').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /profilePages', () => {
    it.each([
      {
        name: 'existing profile page with all values',
        create: createPageRequestBuilder('Test name 1', 'test-path-1', 'Nav Link 1', false, true),
        edit: editPageRequestBuilder('Test name 2', 'test-path-2', 'Nav Link 2'),
      },
      {
        name: 'existing profile page with only name',
        create: createPageRequestBuilder('Test name 1'),
        edit: editPageRequestBuilder('Test name 2'),
      },
    ])('should successfully update $name', async ({ create, edit }) => {
      mockVerify();
      const cRes = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(create)
        .expect(200);
      const createRes: CreateProfilePageResponseInterface = cRes.body;

      assertCreateProfilePageResponse(createRes);
      await request(app.getServer())
        .put('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...edit, pageID: createRes.pageID })
        .expect(200);

      await removeProfilePage(createRes.pageID);
    });
    it('should throw 409 if name already exists for restaurant page while editing profile page', async () => {
      mockVerify();
      const req1 = createPageRequestBuilder('profile page with duplicate name', null, null, false);
      const mRes1 = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response1: CreateProfilePageResponseInterface = mRes1.body;

      const req2 = createPageRequestBuilder('profile page with unique name', null, null, false);
      const mRes2 = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);
      const response2: CreateProfilePageResponseInterface = mRes2.body;

      const editReq = editPageRequestBuilder('profile page with duplicate name');

      await request(app.getServer())
        .put('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...editReq, pageID: response2.pageID })
        .expect(409);

      await removeProfilePage(response1.pageID);
      await removeProfilePage(response2.pageID);
    });
    it('should throw 409 if url path already exists for restaurant while editing profile page', async () => {
      mockVerify();
      const req1 = createPageRequestBuilder('profile page with duplicate url path', 'test-path', null, false);
      const mRes1 = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req1)
        .expect(200);
      const response1: CreateProfilePageResponseInterface = mRes1.body;

      const req2 = createPageRequestBuilder('profile page with unique url path', 'unique-path', null, false);
      const mRes2 = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);
      const response2: CreateProfilePageResponseInterface = mRes2.body;

      const editReq = { ...editPageRequestBuilder('profile page with duplicate path', 'test-path'), pageID: response2.pageID };

      await request(app.getServer()).put('/profilePages').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(409);

      await removeProfilePage(response1.pageID);
      await removeProfilePage(response2.pageID);
    });
    it.each([editPageRequestBuilder('urlPath for profile page is not in kebab case', 'url path')])(
      'should return 400 Bad Request if $name',
      async (req: EditProfilePageRequestInterface) => {
        mockVerify();
        const req1 = createPageRequestBuilder('profile page with duplicate name', null, null, false);
        const mRes = await request(app.getServer())
          .post('/profilePages')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send(req1)
          .expect(200);
        const response1: CreateProfilePageResponseInterface = mRes.body;

        await request(app.getServer())
          .put('/profilePages')
          .set('Authorization', 'token')
          .set('restaurantID', '1')
          .send({ ...req, pageID: response1.pageID })
          .expect(400);
        if (response1.profileSections) {
          await removeProfileSections(response1.profileSections.map(section => section.sectionID));
        }
        await removeProfilePage(response1.pageID);
      },
    );
  });
  describe('GET /profilePages/:pageID', () => {
    it('should successfully get profile page details with sections, cards, and media', async () => {
      const RESTAURANT_ID = 1;
      const createPageReq = createPageRequestBuilder('profile page name', 'test-path', 'Test Link', false, false, [
        { ...SECTIONS[2], name: 'section with card' },
      ]);
      mockVerify();
      const createPageRes = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createPageReq)
        .expect(200);
      const createPageResponse: CreateProfilePageResponseInterface = createPageRes.body;
      const pageID = createPageResponse?.pageID;
      const sectionID = createPageResponse?.profileSections[0]?.sectionID;

      const createSectionCardReq: CreateProfileSectionCardsDto = {
        sectionID,
        title: 'test card title',
        content: 'test card content',
        subtitle: 'test card subtitle',
        linkURL: 'test card link',
      };

      mockVerify();
      const createSectionCardRes = await request(app.getServer())
        .post('/profileSections/cards')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createSectionCardReq)
        .expect(200);
      const createCardResponse: RestaurantProfileSectionCardsInterface = createSectionCardRes.body;
      const cardID = createCardResponse?.cardID;

      const mediaResponse = await createImageMediaEntities(['image1.jpeg'], RESTAURANT_ID);
      const linkMediaToCardReq: LinkMediaToProfileCardDto = {
        mediaID: mediaResponse[0].media_id,
        cardID,
      };

      // For initial version of Profile pages, we are only linking one media to each card.
      await request(app.getServer())
        .put('/profileSections/cards/media')
        .set('Authorization', 'token')
        .set('restaurantID', RESTAURANT_ID.toString())
        .send(linkMediaToCardReq)
        .expect(200);

      mockVerify();
      const mRes = await request(app.getServer()).get(`/profilePages/${pageID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      const response: GetProfilePageDetailsResponseInterface = mRes.body;
      assertGetProfilePageDetailsResponse(response);

      // clean up
      await removeProfileCardsMediaEntities([mediaResponse[0].media_id]);
      if (response.profileSections) {
        await removeProfileSections(response.profileSections.map(section => section.sectionID));
      }
      await removeImageMediaEntities([mediaResponse[0].media_id]);
      await removeProfilePage(response.pageID);
    });
    it('should successfully get profile page details with empty sections', async () => {
      const createPageReq = createPageRequestBuilder('profile page name', 'test-path', 'Test Link', false, false);
      mockVerify();
      const createPageRes = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createPageReq)
        .expect(200);
      const createPageResponse: CreateProfilePageResponseInterface = createPageRes.body;
      const pageID = createPageResponse?.pageID;

      mockVerify();
      const mRes = await request(app.getServer()).get(`/profilePages/${pageID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      const response: GetProfilePageDetailsResponseInterface = mRes.body;

      expect(typeof response.pageID).toBe('number');
      expect(typeof response.name).toBe('string');
      expect(typeof response.seoTitle).toBe('string');
      expect(typeof response.seoDescription).toBe('string');
      expect(typeof response.urlPath).toBe('string');
      expect(typeof response.navLink).toBe('string');
      expect(typeof response.isHidden).toBe('boolean');

      expect(Array.isArray(response.profileSections)).toBe(true);
      expect(response.profileSections.length).toBe(0);

      // clean up
      await removeProfilePage(response.pageID);
    });
    it('should successfully get profile page details with sections and empty cards and empty media links ', async () => {
      const createPageReq = createPageRequestBuilder('profile page name', 'test-path', 'Test Link', false, false, SECTIONS);
      mockVerify();
      const createPageRes = await request(app.getServer())
        .post('/profilePages')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createPageReq)
        .expect(200);
      const createPageResponse: CreateProfilePageResponseInterface = createPageRes.body;
      const pageID = createPageResponse?.pageID;

      mockVerify();
      const mRes = await request(app.getServer()).get(`/profilePages/${pageID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      const response: GetProfilePageDetailsResponseInterface = mRes.body;

      expect(typeof response.pageID).toBe('number');
      expect(typeof response.name).toBe('string');
      expect(typeof response.seoTitle).toBe('string');
      expect(typeof response.seoDescription).toBe('string');
      expect(typeof response.urlPath).toBe('string');
      expect(typeof response.navLink).toBe('string');
      expect(typeof response.isHidden).toBe('boolean');

      expect(Array.isArray(response.profileSections)).toBe(true);

      response.profileSections?.forEach((section: ProfileSectionWithCardMediaInterface) => {
        expect(typeof section.sectionID).toBe('number');
        expect(typeof section.name).toBe('string');
        expect(typeof section.title).toBe('string');
        expect(typeof section.content).toBe('string');
        expect(typeof section.template).toBe('string');
        expect(typeof section.urlPath).toBe('string');
        expect(typeof section.subNav).toBe('string');
        expect(typeof section.isHidden).toBe('boolean');

        expect(section.cards?.length).toBe(0);
        expect(section.media?.length).toBe(0);
      });

      // clean up
      if (response.profileSections) {
        await removeProfileSections(response.profileSections.map(section => section.sectionID));
      }
      await removeProfilePage(response.pageID);
    });
    it('should throw 400 if pageID is invalid', async () => {
      const PAGE_ID_INVALID = 'a';
      mockVerify();
      await request(app.getServer()).get(`/profilePages/${PAGE_ID_INVALID}`).set('Authorization', 'token').set('restaurantID', '1').expect(400);
    });
    it('should throw 404 if profile page does not exist', async () => {
      const PAGE_ID_NOT_FOUND = 9999999;
      mockVerify();
      await request(app.getServer()).get(`/profilePages/${PAGE_ID_NOT_FOUND}`).set('Authorization', 'token').set('restaurantID', '1').expect(404);
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

const removeProfilePage = async (pageID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(ProfilePageEntity, pageID);
};

const removeProfileSections = async (sectionIDs: number[]): Promise<void> => {
  if (sectionIDs.length > 0) {
    const repository = await ormConnection();
    await repository.delete(ProfileSectionEntity, sectionIDs);
  }
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
 * delete image in media library table
 */
const removeProfileCardsMediaEntities = async (cardMediaIDs: number[]): Promise<void> => {
  const repository = await ormConnection();
  for (const id of cardMediaIDs) {
    await repository.delete(ProfileCardsMediaEntity, id);
  }
};
