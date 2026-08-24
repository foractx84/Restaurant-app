import { Request, Response, NextFunction } from 'express';
import { SectionTemplates } from '@enums/sectionTemplates';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { ProfileSectionEntity } from '@entities/profileSection.entity';
import { HttpException } from '@exceptions/HttpException';
import ProfileSectionsModel from '@/models/profileSections.model';
import { checkPageSectionTemplateTypeAndCards } from '@/middlewares/checkPageSectionTemplateTypeAndCards.middleware';
import { ProfilePageEntity } from '@/entities/profilePage.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/profileSections.model', () => {
  const mockProfileSectionsModel = {
    fetchPageSectionByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionsModel) };
});

const profileSectionsModel = new ProfileSectionsModel();

describe('checkPageSectionTemplateTypeAndCards', () => {
  const RESTAURANT_ID = 1;
  const SECTION_ID = 1;
  const PAGE_ID = 223;
  const PAGE_SECTION_TEMPLATE = {
    sectionTemplateID: 2,
    template: SectionTemplates.CONTENT_CARDS,
  };
  const PAGE_SECTION_ENTITY_CONTENT_CARDS: ProfileSectionEntity = new ProfileSectionEntity(
    {
      sectionID: SECTION_ID,
      name: 'Existing Section',
      title: 'Existing Title',
      content: 'Existing content',
      template: SectionTemplates.CONTENT_CARDS,
      urlPath: 'existing-path',
      subNav: 'Existing Section',
      isHidden: false,
    },
    PAGE_ID,
  );
  const PAGE_SECTION_ENTITY_INTERACTIVE_CONTENT_CARDS: ProfileSectionEntity = new ProfileSectionEntity(
    {
      sectionID: SECTION_ID,
      name: 'Existing Section',
      title: 'Existing Title',
      content: 'Existing content',
      template: SectionTemplates.INTERACTIVE_CONTENT_CARDS,
      urlPath: 'existing-path',
      subNav: 'Existing Section',
      isHidden: false,
    },
    PAGE_ID,
  );

  const PAGE_SECTION_ENTITY_NO_TEMPLATE: ProfileSectionEntity = new ProfileSectionEntity(
    {
      sectionID: SECTION_ID,
      name: 'Existing Section',
      title: 'Existing Title',
      content: 'Existing content',
      template: '',
      urlPath: 'existing-path',
      subNav: 'Existing Section',
      isHidden: false,
    },
    PAGE_ID,
  );

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully validate profile section request is a template type CONTENT_CARDS that allows for creating / editing card', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PAGE_SECTION_ENTITY_CONTENT_CARDS,
    });

    const mNext = jest.fn();

    await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
  });
  it('should successfully validate profile section request is a template type INTERACTIVE_CONTENT_CARDS that allows for creating / editing card', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PAGE_SECTION_ENTITY_INTERACTIVE_CONTENT_CARDS,
    });

    const mNext = jest.fn();

    await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 if section id is undefined', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined as ProfileSectionEntity);

    const mNext = jest.fn();

    try {
      await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 if retaurantID is undefined', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: ``,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: {},
    };

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PAGE_SECTION_ENTITY_CONTENT_CARDS,
    });

    const mNext = jest.fn();

    try {
      await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 if page section doesnt exist', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined as ProfileSectionEntity);

    const mNext = jest.fn();

    try {
      await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 if page section template doesnt exist', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PAGE_SECTION_ENTITY_NO_TEMPLATE,
    });

    const mNext = jest.fn();

    try {
      await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 if page section template is type COPY and attempting to create / edit card', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: RESTAURANT_ID },
    };
    const originalTemplate = PAGE_SECTION_TEMPLATE.template;
    PAGE_SECTION_TEMPLATE.template = SectionTemplates.COPY;
    PAGE_SECTION_ENTITY_CONTENT_CARDS.sectionTemplate = PAGE_SECTION_TEMPLATE;

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PAGE_SECTION_ENTITY_CONTENT_CARDS,
    });

    const mNext = jest.fn();

    try {
      await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    PAGE_SECTION_TEMPLATE.template = originalTemplate;
    PAGE_SECTION_ENTITY_CONTENT_CARDS.sectionTemplate = PAGE_SECTION_TEMPLATE;

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 if page section template is type MEDIA_GALLERY and attempting to create / edit card', async () => {
    const mReq: Partial<Request> = {
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const originalTemplate = PAGE_SECTION_TEMPLATE.template;
    PAGE_SECTION_TEMPLATE.template = SectionTemplates.MEDIA_GALLERY;
    PAGE_SECTION_ENTITY_CONTENT_CARDS.sectionTemplate = PAGE_SECTION_TEMPLATE;

    (profileSectionsModel.fetchPageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PAGE_SECTION_ENTITY_CONTENT_CARDS,
    });

    const mNext = jest.fn();

    try {
      await checkPageSectionTemplateTypeAndCards(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    PAGE_SECTION_TEMPLATE.template = originalTemplate;
    PAGE_SECTION_ENTITY_CONTENT_CARDS.sectionTemplate = PAGE_SECTION_TEMPLATE;

    expect(mNext).toHaveBeenCalled();
  });
});
