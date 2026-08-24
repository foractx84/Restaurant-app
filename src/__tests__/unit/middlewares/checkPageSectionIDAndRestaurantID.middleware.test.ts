import { Request, Response, NextFunction } from 'express';
import { ProfileSectionEntity } from '@entities/profileSection.entity';
import { SectionTemplates } from '@enums/sectionTemplates';
import ProfileSectionsModel from '@models/profileSections.model';
import checkPageSectionIDAndRestaurantIDMiddleware from '@middlewares/checkPageSectionIDAndRestaurantID.middleware';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { ProfilePageEntity } from '@entities/profilePage.entity';
import { CreateProfilePageResponseInterface } from '@interfaces/profilePages.interface';
import { HttpException } from '@exceptions/HttpException';
import { getCurrentTimeForTimeZone } from '@utils/timeUtils';

jest.mock('@utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@models/profileSections.model', () => {
  const mockProfileSectionsModel = {
    fetchProfilePageSectionByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionsModel) };
});

const profileSectionsModel = new ProfileSectionsModel();

describe('checkPageSectionIDAndRestaurantIDMiddleware', () => {
  const PAGE_ID = 2;

  const SECTION_ID = 12;
  const RESTAURANT_ID = 1;
  const PROFILE_SECTION: ProfileSectionEntity = new ProfileSectionEntity(
    {
      sectionID: SECTION_ID,
      name: 'Test Name',
      title: 'Test Title',
      content: 'Test Content',
      template: SectionTemplates.COPY,
      urlPath: 'copy-path',
      subNav: 'Copy Nav',
      isHidden: false,
    },
    PAGE_ID,
    { sectionTemplateID: 1, template: SectionTemplates.COPY },
  );
  const PROFILE_PAGE: ProfilePageEntity = {
    restaurantProfilePageID: PAGE_ID,
    name: 'Test Page',
    restaurantID: RESTAURANT_ID,
    isHidden: false,
    deletedAt: null,
    seoTitle: '',
    listOrder: 0,
    clone: () => {
      return {} as ProfilePageEntity;
    },
    buildCreateProfilePageResponse: () => {
      return {} as CreateProfilePageResponseInterface;
    },
    restaurant: {
      restaurant_id: RESTAURANT_ID,
    },
  };
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should successfully find profile section linked to restaurant', async () => {
    const mReq: Partial<Request> = {
      body: {
        sectionID: SECTION_ID,
      },
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    (profileSectionsModel.fetchProfilePageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce({
      ...PROFILE_SECTION,
      profilePage: PROFILE_PAGE,
    });

    const mNext = jest.fn();

    await checkPageSectionIDAndRestaurantIDMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 Bad Request HTTP exception if restaurantID not provided in header request', async () => {
    const mReq: Partial<Request> = {
      body: {
        sectionID: SECTION_ID,
      },
      headers: {
        authorization: 'token',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    const mNext = jest.fn();

    try {
      await checkPageSectionIDAndRestaurantIDMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 400 Bad Request HTTP exception if sectionID not provided in body request', async () => {
    const mReq: Partial<Request> = {
      body: {},
      headers: {
        authorization: 'token',
        restaurantID: `${RESTAURANT_ID}`,
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
    };
    const mNext = jest.fn();

    try {
      await checkPageSectionIDAndRestaurantIDMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(400);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it.each([
    { name: 'does not exist for provided section id', profileSection: undefined },
    { name: 'does not have an assigned profile page', profileSection: PROFILE_SECTION },
    {
      name: 'has a profile page that has been deleted',
      profileSection: { ...PROFILE_SECTION, profilePage: { ...PROFILE_PAGE, deletedAt: getCurrentTimeForTimeZone() } },
    },
    {
      name: 'has a profile page tied to a different restaurant than provided in header',
      profileSection: { ...PROFILE_SECTION, profilePage: { ...PROFILE_PAGE, restaurant: { restaurant_id: 12345 } } },
    },
  ])(
    `should throw 404 Not Found exception if section $name`,
    async ({ profileSection }: { name: string; profileSection: ProfileSectionEntity | undefined }) => {
      const mReq: Partial<Request> = {
        body: {
          sectionID: SECTION_ID,
        },
        headers: {
          authorization: 'token',
          restaurantID: `${RESTAURANT_ID}`,
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      (profileSectionsModel.fetchProfilePageSectionByID as jest.MockedFunction<any>).mockResolvedValueOnce(profileSection);

      const mNext = jest.fn();

      try {
        await checkPageSectionIDAndRestaurantIDMiddleware(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mNext).toHaveBeenCalled();
    },
  );
});
