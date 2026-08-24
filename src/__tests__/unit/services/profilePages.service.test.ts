import { TapManagerError } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ProfilePagesService from '@services/profilePages.service';
import ProfileSectionsService from '@services/profileSections.service';
import { ProfileSectionTemplatesServiceInterface } from '@interfaces/profileSectionTemplates.interface';
import { ProfileSectionInterface, ProfileSectionsModelInterface } from '@interfaces/profileSections.interface';
import ProfilePagesModel from '@/models/profilePages.model';
import {
  CreateProfilePageRequestInterface,
  EditProfilePageRequestInterface,
  GetProfilePageDetailsResponseInterface,
} from '@interfaces/profilePages.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { RestaurantProfileMediaServiceInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { MediaLibraryServiceInterface } from '@/interfaces/mediaLibrary.interface';
import { ProfileCardsServiceInterface } from '@/interfaces/profileCards.interface';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/models/profilePages.model', () => {
  const mockProfilePagesModel = {
    fetchProfilePagesByRestaurantID: jest.fn(),
    upsertProfilePage: jest.fn(),
    fetchProfilePageByPageID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfilePagesModel) };
});
jest.mock('@/services/profileSections.service', () => {
  const mockProfileSectionsService = {
    buildProfileSectionEntities: jest.fn(),
    createProfileSections: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionsService) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockProfilePagesModel = new ProfilePagesModel();
const mockProfileSectionsService = new ProfileSectionsService(
  {} as ProfileSectionTemplatesServiceInterface,
  {} as ProfileSectionsModelInterface,
  {} as MediaLibraryServiceInterface,
  {} as RestaurantProfileMediaServiceInterface,
  {} as ProfileCardsServiceInterface,
);
const profilePagesService = new ProfilePagesService(mockProfileSectionsService, mockProfilePagesModel);

describe('profilePagesService', () => {
  const RESTAURANT_ID = 1;
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createProfilePage', () => {
    const CREATE_PROFILE_REQUEST_REQUIRED_VALUES: CreateProfilePageRequestInterface = {
      name: 'Test Name',
      seoTitle: 'Test SEO title',
      isHidden: false,
    };
    const CREATE_PROFILE_REQUEST_OPTIONAL_VALUES: CreateProfilePageRequestInterface = {
      ...CREATE_PROFILE_REQUEST_REQUIRED_VALUES,
      seoDescription: 'Test SEO description',
      urlPath: 'url-path',
      navLink: 'Test Link',
      profileSections: [
        {
          name: 'Test Copy Section',
          title: 'Test title',
          content: 'Test content',
          template: SectionTemplates.COPY,
          urlPath: 'copy-path',
          subNav: 'Copy Link',
          isHidden: false,
        },
        {
          name: 'Test Media Gallery Section',
          title: 'Test title',
          template: SectionTemplates.MEDIA_GALLERY,
          urlPath: 'gallery-path',
          subNav: 'Gallery Link',
          isHidden: true,
        },
      ],
    };
    it('should successfully create profile page with all values', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.createProfilePage(CREATE_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should successfully create profile page with only required values', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.createProfilePage(CREATE_PROFILE_REQUEST_REQUIRED_VALUES, RESTAURANT_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 and fail to create profile page if page with same name exists', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        new ProfilePageEntity(CREATE_PROFILE_REQUEST_REQUIRED_VALUES.name, 'test title', RESTAURANT_ID, true),
      ]);

      try {
        await profilePagesService.createProfilePage(CREATE_PROFILE_REQUEST_REQUIRED_VALUES, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).not.toHaveBeenCalled();
    });
    it('should pass validation to create profile page if page with same urlPath exists but existing page is hidden', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        new ProfilePageEntity('Different title', 'test title', RESTAURANT_ID, true, '', '', CREATE_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath),
      ]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.createProfilePage(CREATE_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should pass validation to create profile page if page with same urlPath exists but page being created is hidden', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        new ProfilePageEntity('Different title', 'test title', RESTAURANT_ID, false, '', '', CREATE_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath),
      ]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.createProfilePage({ ...CREATE_PROFILE_REQUEST_OPTIONAL_VALUES, isHidden: true }, RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 and fail to create profile page if page with same urlPath exists', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        new ProfilePageEntity('Different title', 'test title', RESTAURANT_ID, false, '', 'url-path', CREATE_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath),
      ]);

      try {
        await profilePagesService.createProfilePage(CREATE_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).not.toHaveBeenCalled();
    });
    it('should throw 500 HttpException if any error occurs while creating profile page', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profilePagesService.createProfilePage(CREATE_PROFILE_REQUEST_REQUIRED_VALUES, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editProfilePage', () => {
    const EDIT_PROFILE_REQUEST_OPTIONAL_VALUES: EditProfilePageRequestInterface = {
      pageID: 2134,
      name: 'Test Name',
      seoTitle: 'Test SEO title',
      isHidden: false,
      seoDescription: 'Test SEO description',
      urlPath: 'url-path',
      navLink: 'Test Link',
    };
    it('should successfully update profile page with all values', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.editProfilePage(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 and fail to edit profile page if page with same name exists', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        { restaurantProfilePageID: 1432, ...new ProfilePageEntity(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES.name, 'test title', RESTAURANT_ID, true) },
      ]);

      try {
        await profilePagesService.editProfilePage(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).not.toHaveBeenCalled();
    });
    it('should pass validation to edit profile page if page with same name exists but has the same id', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurantProfilePageID: EDIT_PROFILE_REQUEST_OPTIONAL_VALUES.pageID,
          ...new ProfilePageEntity('Different title', 'test title', RESTAURANT_ID, true, '', '', EDIT_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath),
        },
      ]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.editProfilePage(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should pass validation to edit profile page if page with same urlPath exists but existing page is hidden', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurantProfilePageID: 1432,
          ...new ProfilePageEntity('Different title', 'test title', RESTAURANT_ID, true, '', '', EDIT_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath),
        },
      ]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.editProfilePage(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should pass validation to edit profile page if page with same urlPath exists but page being created is hidden', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurantProfilePageID: 1432,
          ...new ProfilePageEntity('Different title', 'test title', RESTAURANT_ID, false, '', '', EDIT_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath),
        },
      ]);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profilePagesService.editProfilePage({ ...EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, isHidden: true }, RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 and fail to edit profile page if page with same urlPath exists', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          restaurantProfilePageID: 1432,
          ...new ProfilePageEntity(
            'Different title',
            'test title',
            RESTAURANT_ID,
            false,
            '',
            'url-path',
            EDIT_PROFILE_REQUEST_OPTIONAL_VALUES.urlPath,
          ),
        },
      ]);

      try {
        await profilePagesService.editProfilePage(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(ormConnection).not.toHaveBeenCalled();
    });
    it('should throw 500 HttpException if any error occurs while editing profile page', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profilePagesService.editProfilePage(EDIT_PROFILE_REQUEST_OPTIONAL_VALUES, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getProfilePageByRestaurantID', () => {
    it('should successfully get profile page with only required values by restaurant id', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockImplementationOnce((restaurantID: number) => {
        return [
          {
            ...new ProfilePageEntity('test name', 'test title', restaurantID, false),
            restaurantProfilePageID: 1,
            listOrder: 0,
            buildCreateProfilePageResponse: undefined,
          },
        ];
      });

      const result = await profilePagesService.getProfilePageByRestaurantID(RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          restaurantProfilePageID: 1,
          name: 'test name',
          seoTitle: 'test title',
          isHidden: false,
          restaurantID: RESTAURANT_ID,
          listOrder: 0,
        },
      ] as ProfilePageEntity[]);
    });
    it('should successfully get profile page with all values by restaurant id', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockImplementationOnce((restaurantID: number) => {
        return [
          {
            ...new ProfilePageEntity('test name', 'test title', restaurantID, false),
            restaurantProfilePageID: 1,
            listOrder: 0,
            buildCreateProfilePageResponse: undefined,
            navLink: 'Test Link',
            profileSections: [
              {
                restaurantProfileSectionID: 1,
                restaurantProfilePageID: 1,
                sectionTemplateID: 1,
                name: 'Copy Template',
                title: 'Test title',
                content: 'test content',
                urlPath: 'copy-path',
                subNav: 'Copy Link',
                listOrder: 0,
                isHidden: false,
                sectionTemplate: {
                  sectionTemplateID: 1,
                  template: SectionTemplates.COPY,
                },
              },
              {
                restaurantProfileSectionID: 2,
                restaurantProfilePageID: 1,
                sectionTemplateID: 2,
                name: 'Media Gallery Template',
                title: 'Test title',
                urlPath: 'gallery-path',
                subNav: 'Gallery Link',
                listOrder: 1,
                isHidden: false,
                sectionTemplate: {
                  sectionTemplateID: 2,
                  template: SectionTemplates.MEDIA_GALLERY,
                },
              },
            ],
            seoDescription: 'test description',
            urlPath: 'test-path',
          },
        ];
      });

      const result = await profilePagesService.getProfilePageByRestaurantID(RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          restaurantProfilePageID: 1,
          name: 'test name',
          seoTitle: 'test title',
          isHidden: false,
          restaurantID: RESTAURANT_ID,
          listOrder: 0,
          navLink: 'Test Link',
          buildCreateProfilePageResponse: undefined,
          profileSections: [
            {
              restaurantProfileSectionID: 1,
              restaurantProfilePageID: 1,
              sectionTemplateID: 1,
              name: 'Copy Template',
              title: 'Test title',
              content: 'test content',
              urlPath: 'copy-path',
              subNav: 'Copy Link',
              listOrder: 0,
              isHidden: false,
              sectionTemplate: {
                sectionTemplateID: 1,
                template: SectionTemplates.COPY,
              },
            },
            {
              restaurantProfileSectionID: 2,
              restaurantProfilePageID: 1,
              sectionTemplateID: 2,
              name: 'Media Gallery Template',
              title: 'Test title',
              urlPath: 'gallery-path',
              subNav: 'Gallery Link',
              listOrder: 1,
              isHidden: false,
              sectionTemplate: {
                sectionTemplateID: 2,
                template: SectionTemplates.MEDIA_GALLERY,
              },
            },
          ],
          seoDescription: 'test description',
          urlPath: 'test-path',
        },
      ] as ProfilePageEntity[]);
    });
    it('should return empty array if no profile pages exist for restaurant id', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await profilePagesService.getProfilePageByRestaurantID(RESTAURANT_ID);

      expect(mockProfilePagesModel.fetchProfilePagesByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should throw 500 HttpException if any error occurs while getting profile pages by restaurant id', async () => {
      (mockProfilePagesModel.fetchProfilePagesByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profilePagesService.getProfilePageByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getProfilePageDetails', () => {
    const PAGE_ID = 1;
    it('should successfully get profile page details by pageID', async () => {
      const profileSectionInterface: ProfileSectionInterface = {
        sectionID: 23,
        name: 'profile section of type content_cards',
        title: 'Content Cards Profile Section',
        content: null,
        urlPath: 'content-cards-path',
        subNav: 'Content Cards Nav',
        isHidden: true,
        template: SectionTemplates.CONTENT_CARDS,
      };
      const sectionTemplate = {
        template: SectionTemplates.CONTENT_CARDS,
      } as ProfileSectionTemplateEntity;
      const pageSection = new ProfileSectionEntity(profileSectionInterface, 1, sectionTemplate);
      const pageEntity = new ProfilePageEntity(
        'Noho_About_Page',
        'About the Noho Restaurant',
        1,
        true,
        'Get to know The Noho Restaurant',
        'about-us',
        'About',
        [pageSection],
      );
      pageEntity.restaurantProfilePageID = PAGE_ID;
      const mockServiceResponse: GetProfilePageDetailsResponseInterface = {
        pageID: PAGE_ID,
        name: 'Noho_About_Page',
        seoTitle: 'About the Noho Restaurant',
        seoDescription: 'Get to know The Noho Restaurant',
        urlPath: 'about-us',
        navLink: 'About',
        isHidden: true,
        profileSections: [
          {
            sectionID: 23,
            name: 'profile section of type content_cards',
            title: 'Content Cards Profile Section',
            content: '',
            template: SectionTemplates.CONTENT_CARDS,
            urlPath: 'content-cards-path',
            subNav: 'Content Cards Nav',
            isHidden: true,
            media: [],
            cards: [],
          },
        ],
      };
      (mockProfilePagesModel.fetchProfilePageByPageID as jest.MockedFunction<any>).mockResolvedValueOnce(pageEntity);

      const result = await profilePagesService.getProfilePageDetails(PAGE_ID);

      expect(mockProfilePagesModel.fetchProfilePageByPageID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });
    it('should throw 500 HttpException if any error occurs while getting profile page details', async () => {
      (mockProfilePagesModel.fetchProfilePageByPageID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await profilePagesService.getProfilePageDetails(PAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
