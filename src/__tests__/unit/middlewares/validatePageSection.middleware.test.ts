import { Request, Response, NextFunction } from 'express';
import ProfilePagesModel from '@/models/profilePages.model';
import { CreateProfileSectionRequest, ProfileSectionInterface } from '@interfaces/profileSections.interface';
import { SectionTemplates } from '@enums/sectionTemplates';
import { validatePageSectionMiddleware } from '@middlewares/validatePageSection.middleware';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { ProfilePageEntity } from '@entities/profilePage.entity';
import { ProfileSectionEntity } from '@entities/profileSection.entity';
import { HttpException } from '@exceptions/HttpException';
import { CreateProfilePageResponseInterface } from '@interfaces/profilePages.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/profilePages.model', () => {
  const mockProfilePagesModel = {
    fetchProfilePageByPageID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfilePagesModel) };
});

const profilePagesModel = new ProfilePagesModel();

describe('validatePageSection', () => {
  const RESTAURANT_ID = 1;
  const PAGE_ID = 223;
  const SECTION_ID = 123;
  const CREATE_SECTION_REQUEST: CreateProfileSectionRequest = {
    pageID: PAGE_ID,
    name: 'Test Copy Section',
    title: 'Test title',
    content: 'Test content',
    template: SectionTemplates.COPY,
    urlPath: 'copy-path',
    subNav: 'Copy Link',
    isHidden: false,
  };
  const PROFILE_PAGE_ENTITY: ProfilePageEntity = new ProfilePageEntity(
    'Test Name',
    'Test Title',
    RESTAURANT_ID,
    false,
    'This is a description',
    'test-path',
    'Test Page',
  );
  const PAGE_SECTION_ENTITY: ProfileSectionEntity = new ProfileSectionEntity(
    {
      sectionID: SECTION_ID,
      name: 'Existing Section',
      title: 'Existing Title',
      content: 'Existing content',
      template: SectionTemplates.COPY,
      urlPath: 'existing-path',
      subNav: 'Existing Section',
      isHidden: false,
    },
    PAGE_ID,
    {
      sectionTemplateID: 1,
      template: SectionTemplates.COPY,
    },
  );
  const PROFILE_PAGE_METADATA: ProfilePageEntity = {
    ...PROFILE_PAGE_ENTITY,
    profileSections: [PAGE_SECTION_ENTITY],
    clone: () => {
      return {} as ProfilePageEntity;
    },
    buildCreateProfilePageResponse: () => {
      return {} as CreateProfilePageResponseInterface;
    },
  };
  const EDIT_PROFILE_SECTION: ProfileSectionInterface = {
    sectionID: SECTION_ID,
    name: 'Test Name',
    title: 'Test Title',
    content: 'Test Content',
    template: SectionTemplates.COPY,
    urlPath: 'copy-path',
    subNav: 'Copy Nav',
    isHidden: false,
  };
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully validate create profile section request against existing sections for page', async () => {
    const mReq: Partial<Request> = {
      body: CREATE_SECTION_REQUEST,
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    (profilePagesModel.fetchProfilePageByPageID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PROFILE_PAGE_ENTITY,
      profileSections: [PAGE_SECTION_ENTITY],
    } as ProfilePageEntity);

    const mNext = jest.fn();

    await validatePageSectionMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
  });
  it('should successfully validate create profile section request when no existing sections for page', async () => {
    const mReq: Partial<Request> = {
      body: CREATE_SECTION_REQUEST,
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    (profilePagesModel.fetchProfilePageByPageID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PROFILE_PAGE_ENTITY,
      profileSections: [],
    } as ProfilePageEntity);

    const mNext = jest.fn();

    await validatePageSectionMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
  });
  it.each([
    { name: `with all values for ${SectionTemplates.COPY} template`, request: EDIT_PROFILE_SECTION, sections: [PAGE_SECTION_ENTITY] },
    {
      name: `with all values for ${SectionTemplates.MEDIA_GALLERY} template`,
      request: { ...EDIT_PROFILE_SECTION, template: SectionTemplates.MEDIA_GALLERY },
      sections: [{ ...PAGE_SECTION_ENTITY, template: SectionTemplates.MEDIA_GALLERY, sectionTemplate: { template: SectionTemplates.MEDIA_GALLERY } }],
    },
    {
      name: `with all values for ${SectionTemplates.CONTENT_CARDS} template`,
      request: { ...EDIT_PROFILE_SECTION, template: SectionTemplates.CONTENT_CARDS },
      sections: [{ ...PAGE_SECTION_ENTITY, template: SectionTemplates.CONTENT_CARDS, sectionTemplate: { template: SectionTemplates.CONTENT_CARDS } }],
    },
    {
      name: `with all values for ${SectionTemplates.INTERACTIVE_CONTENT_CARDS} template`,
      request: { ...EDIT_PROFILE_SECTION, template: SectionTemplates.INTERACTIVE_CONTENT_CARDS },
      sections: [
        {
          ...PAGE_SECTION_ENTITY,
          template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
          sectionTemplate: { template: SectionTemplates.INTERACTIVE_CONTENT_CARDS },
        },
      ],
    },
    {
      name: `with subNav and no urlPath in request but urlPath existing on section`,
      request: { ...EDIT_PROFILE_SECTION, urlPath: undefined },
      sections: [PAGE_SECTION_ENTITY],
    },
    {
      name: `with removal of subNav and urlPath for section`,
      request: { ...EDIT_PROFILE_SECTION, urlPath: '', subNav: '' },
      sections: [PAGE_SECTION_ENTITY],
    },
    {
      name: `with name that already exists for the same section`,
      request: { ...EDIT_PROFILE_SECTION, name: 'Duplicate but valid' },
      sections: [{ ...PAGE_SECTION_ENTITY, name: 'Duplicate but valid' }],
    },
    {
      name: `with urlPath that already exists for the same section`,
      request: { ...EDIT_PROFILE_SECTION, urlPath: 'duplicate-but-valid' },
      sections: [{ ...PAGE_SECTION_ENTITY, urlPath: 'duplicate-but-valid' }],
    },
    {
      name: `with subNav that already exists for the same section`,
      request: { ...EDIT_PROFILE_SECTION, subNav: 'Duplicate but valid' },
      sections: [{ ...PAGE_SECTION_ENTITY, urlPath: 'Duplicate but valid' }],
    },
  ])(
    `should successfully validate edit profile section request $name`,
    async ({ request, sections }: { name: string; request: ProfileSectionInterface; sections: ProfileSectionEntity[] }) => {
      const mReq: Partial<CustomRequest<ProfilePageEntity>> = {
        body: request,
        headers: {
          authorization: 'token',
          restaurantID: `${RESTAURANT_ID}`,
        },
        metadata: { ...PROFILE_PAGE_METADATA, profileSections: sections } as ProfilePageEntity,
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await validatePageSectionMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalled();
    },
  );
  it.each([
    {
      name: 'name provided already exists on section for page',
      request: { ...CREATE_SECTION_REQUEST, name: PAGE_SECTION_ENTITY.name } as CreateProfileSectionRequest,
    },
    {
      name: 'sub-navigation provided already exists on section for page',
      request: { ...CREATE_SECTION_REQUEST, subNav: PAGE_SECTION_ENTITY.subNav } as CreateProfileSectionRequest,
    },
    {
      name: 'url path provided already exists on section for page',
      request: { ...CREATE_SECTION_REQUEST, urlPath: PAGE_SECTION_ENTITY.urlPath } as CreateProfileSectionRequest,
    },
  ])(
    'should throw 409 Resource Conflict when creating profile section and $name',
    async ({ request }: { name: string; request: CreateProfileSectionRequest }) => {
      const mReq: Partial<Request> = {
        body: request,
        headers: {
          authorization: 'token',
          restaurantID: `${RESTAURANT_ID}`,
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      (profilePagesModel.fetchProfilePageByPageID as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...PROFILE_PAGE_ENTITY,
        profileSections: [PAGE_SECTION_ENTITY],
      } as ProfilePageEntity);

      const mNext = jest.fn();

      try {
        await validatePageSectionMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mNext).toHaveBeenCalled();
    },
  );
  it.each([
    {
      name: 'when subNav is provided with no urlPath and none existing on profile section',
      request: { ...EDIT_PROFILE_SECTION, urlPath: undefined } as ProfileSectionInterface,
      existingPage: {
        ...PROFILE_PAGE_METADATA,
        profileSections: [{ ...PAGE_SECTION_ENTITY, restaurantProfileSectionID: 999, urlPath: null }],
      } as ProfilePageEntity,
    },
    {
      name: 'when removing url path and subNav still exists on profile section',
      request: { ...EDIT_PROFILE_SECTION, urlPath: '', subNav: undefined, name: 'unique name' } as ProfileSectionInterface,
      existingPage: {
        ...PROFILE_PAGE_METADATA,
        profileSections: [{ ...PAGE_SECTION_ENTITY, restaurantProfileSectionID: 999, subNav: 'Test Nav', urlPath: 'test-path', name: 'unique name' }],
      } as ProfilePageEntity,
    },
    {
      name: 'when provided template is not the same for existing on profile section',
      request: { ...EDIT_PROFILE_SECTION, template: SectionTemplates.MEDIA_GALLERY } as ProfileSectionInterface,
      existingPage: {
        ...PROFILE_PAGE_METADATA,
        profileSections: [{ ...PAGE_SECTION_ENTITY, sectionTemplate: { template: SectionTemplates.COPY } }],
      } as ProfilePageEntity,
    },
  ])(
    'should throw 400 Bad Request when editing profile section $name',
    async ({ request, existingPage }: { name: string; request: ProfileSectionInterface; existingPage: ProfilePageEntity }) => {
      const mReq: Partial<CustomRequest<ProfilePageEntity>> = {
        body: request,
        headers: {
          authorization: 'token',
          restaurantID: `${RESTAURANT_ID}`,
        },
        metadata: existingPage,
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      try {
        await validatePageSectionMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mNext).toHaveBeenCalled();
    },
  );
  it.each([
    {
      name: 'name provided already exists on different section for page',
      request: { ...EDIT_PROFILE_SECTION, name: PAGE_SECTION_ENTITY.name } as ProfileSectionInterface,
      existingPage: {
        ...PROFILE_PAGE_METADATA,
        profileSections: [{ ...PAGE_SECTION_ENTITY, restaurantProfileSectionID: 999 }],
      } as ProfilePageEntity,
    },
    {
      name: 'sub-navigation provided already exists on different section for page',
      request: { ...EDIT_PROFILE_SECTION, subNav: PAGE_SECTION_ENTITY.subNav } as ProfileSectionInterface,
      existingPage: {
        ...PROFILE_PAGE_METADATA,
        profileSections: [{ ...PAGE_SECTION_ENTITY, restaurantProfileSectionID: 999 }],
      } as ProfilePageEntity,
    },
    {
      name: 'url path provided already exists on different section for page',
      request: { ...EDIT_PROFILE_SECTION, urlPath: PAGE_SECTION_ENTITY.urlPath } as ProfileSectionInterface,
      existingPage: {
        ...PROFILE_PAGE_METADATA,
        profileSections: [{ ...PAGE_SECTION_ENTITY, restaurantProfileSectionID: 999 }],
      } as ProfilePageEntity,
    },
  ])(
    'should throw 409 Resource Conflict when editing profile section and $name',
    async ({ request }: { name: string; request: ProfileSectionInterface; existingPage: ProfilePageEntity }) => {
      const mReq: Partial<Request> = {
        body: request,
        headers: {
          authorization: 'token',
          restaurantID: `${RESTAURANT_ID}`,
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      (profilePagesModel.fetchProfilePageByPageID as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...PROFILE_PAGE_ENTITY,
        profileSections: [PAGE_SECTION_ENTITY],
      } as ProfilePageEntity);

      const mNext = jest.fn();

      try {
        await validatePageSectionMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mNext).toHaveBeenCalled();
    },
  );
});
