import { TapManagerError } from '@exceptions/HttpException';
import ProfileSectionsService from '@services/profileSections.service';
import { ProfileSectionTemplatesModelInterface } from '@interfaces/profileSectionTemplates.interface';
import { CreateProfileSectionRequest, ProfileSectionInterface } from '@interfaces/profileSections.interface';
import ProfileSectionsModel from '@/models/profileSections.model';
import ProfileSectionTemplatesService from '@services/profileSectionTemplates.service';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { RestaurantProfileMediaServiceInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { MediaLibraryModelInterface } from '@/interfaces/mediaLibrary.interface';
import MediaLibraryService from '@/services/mediaLibrary.service';
import { MediaEntity } from '@/entities/media.entity';
import { IMAGE_TYPE_ID } from '@/constants/media.constants';
import { ormConnection } from '@/utils/dbUtils';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { CreateProfileSectionCardsDto, EditProfileSectionCardsDto } from '@/dtos/profileSections.dto';
import { ProfileCardsModelInterface } from '@/interfaces/profileCards.interface';
import ProfileCardsService from '@/services/profileCards.service';
import { ProfileCardMediaServiceInterface } from '@/interfaces/profileCardsMedia.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/models/profileSections.model', () => {
  const mockProfileSectionsModel = {
    upsertProfileSections: jest.fn(),
    softDeleteProfileSection: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionsModel) };
});
jest.mock('@/services/profileSectionTemplates.service', () => {
  const mockProfileSectionTemplatesService = {
    getProfileSectionTemplatesByNames: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionTemplatesService) };
});
jest.mock('@/services/mediaLibrary.service', () => {
  const mockMediaLibraryService = {
    getMediaByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMediaLibraryService) };
});
jest.mock('@/services/profileCards.service', () => {
  const mockProfileCardsService = {
    deleteCard: jest.fn(),
    upsertCard: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileCardsService) };
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

const mockMediaLibraryService = new MediaLibraryService({} as MediaLibraryModelInterface);
const mockProfileSectionsModel = new ProfileSectionsModel();
const mockProfileSectionTemplatesService = new ProfileSectionTemplatesService({} as ProfileSectionTemplatesModelInterface);
const mockProfileCardsService = new ProfileCardsService({} as ProfileCardsModelInterface, {} as ProfileCardMediaServiceInterface);
const profileSectionsService = new ProfileSectionsService(
  mockProfileSectionTemplatesService,
  mockProfileSectionsModel,
  mockMediaLibraryService,
  {} as RestaurantProfileMediaServiceInterface,
  mockProfileCardsService,
);

describe('profileSectionsService', () => {
  const PROFILE_PAGE_ID = 1234;
  afterEach(() => {
    jest.resetAllMocks();
  });

  const SECTIONS: ProfileSectionInterface[] = [
    {
      sectionID: 123,
      name: 'Test Name 1',
      title: 'Test Title 1',
      content: 'Test content',
      template: SectionTemplates.COPY,
      isHidden: false,
      urlPath: 'copy-path',
      subNav: 'Copy Link',
    },
    {
      sectionID: 124,
      name: 'Test Name 2',
      title: 'Test Title 2',
      template: SectionTemplates.MEDIA_GALLERY,
      isHidden: false,
    },
  ];
  const PROFILE_SECTION_ENTITIES: ProfileSectionEntity[] = [
    new ProfileSectionEntity(
      {
        content: 'Test content',
        isHidden: false,
        name: 'Test Name 1',
        sectionID: 1,
        subNav: 'Copy Link',
        urlPath: 'copy-path',
        title: 'Test Title 1',
        template: SectionTemplates.COPY,
      },
      PROFILE_PAGE_ID,
      {
        sectionTemplateID: 1,
        template: SectionTemplates.COPY,
      },
    ),
    new ProfileSectionEntity(
      {
        content: null,
        isHidden: false,
        name: 'Test Name 2',
        sectionID: 1,
        subNav: null,
        urlPath: null,
        title: 'Test Title 2',
        template: SectionTemplates.MEDIA_GALLERY,
      },
      PROFILE_PAGE_ID,
      {
        sectionTemplateID: 2,
        template: SectionTemplates.MEDIA_GALLERY,
      },
    ),
  ];
  const validateProfileSectionEntities = (profileSectionEntities: ProfileSectionEntity[]) => {
    profileSectionEntities.forEach((section: ProfileSectionEntity) => {
      expect(typeof section.restaurantProfileSectionID).toBe('number');
      expect(section.restaurantProfilePageID).toEqual(PROFILE_PAGE_ID);
      expect(typeof section.name).toBe('string');
      expect(typeof section.title).toBe('string');
      if (section.sectionTemplate.template === SectionTemplates.COPY) {
        expect(typeof section.content).toBe('string');
        expect(typeof section.urlPath).toBe('string');
        expect(typeof section.subNav).toBe('string');
      }
      if (section.subNav) {
        expect(typeof section.urlPath).toBe('string');
        expect(typeof section.subNav).toBe('string');
      }
      expect(typeof section.isHidden).toBe('boolean');
    });
  };
  describe('buildProfileSectionEntities', () => {
    it('should successfully build profile section entities', async () => {
      (mockProfileSectionTemplatesService.getProfileSectionTemplatesByNames as jest.MockedFunction<any>).mockImplementationOnce(
        (templates: string[]) => {
          return templates.map(
            (template, index) =>
              ({
                sectionTemplateID: index + 1,
                template,
              } as ProfileSectionTemplateEntity),
          );
        },
      );

      const result: ProfileSectionEntity[] = await profileSectionsService.buildProfileSectionEntities(SECTIONS, PROFILE_PAGE_ID);

      expect(mockProfileSectionTemplatesService.getProfileSectionTemplatesByNames).toHaveBeenCalledTimes(1);
      expect(result.map(r => ({ ...r, buildProfileSectionResponse: undefined }))).toEqual([
        {
          restaurantProfileSectionID: 123,
          restaurantProfilePageID: PROFILE_PAGE_ID,
          sectionTemplate: {
            sectionTemplateID: 1,
            template: SectionTemplates.COPY,
          },
          name: 'Test Name 1',
          title: 'Test Title 1',
          content: 'Test content',
          isHidden: false,
          urlPath: 'copy-path',
          subNav: 'Copy Link',
          buildProfileSectionResponse: undefined,
        },
        {
          restaurantProfileSectionID: 124,
          restaurantProfilePageID: PROFILE_PAGE_ID,
          sectionTemplate: {
            sectionTemplateID: 2,
            template: SectionTemplates.MEDIA_GALLERY,
          },
          name: 'Test Name 2',
          title: 'Test Title 2',
          isHidden: false,
          content: undefined,
          urlPath: undefined,
          subNav: undefined,
          buildProfileSectionResponse: undefined,
        },
      ] as ProfileSectionEntity[]);
    });
  });
  describe('createProfileSection', () => {
    const CREATE_SECTION_REQUEST: CreateProfileSectionRequest = {
      pageID: 223,
      name: 'Test Copy Section',
      title: 'Test title',
      content: 'Test content',
      template: SectionTemplates.COPY,
      urlPath: 'copy-path',
      subNav: 'Copy Link',
      isHidden: false,
    };
    it('should successfully create profile section', async () => {
      (mockProfileSectionTemplatesService.getProfileSectionTemplatesByNames as jest.MockedFunction<any>).mockImplementationOnce(
        (templates: string[]) => {
          return templates.map(
            (template, index) =>
              ({
                sectionTemplateID: index + 1,
                template,
              } as ProfileSectionTemplateEntity),
          );
        },
      );
      (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mockImplementation((sections: ProfileSectionEntity[]) => {
        return sections.map((section, index) => ({
          ...section,
          restaurantProfileSectionID: index + 1,
        }));
      });

      const result: ProfileSectionInterface = await profileSectionsService.createProfileSection(CREATE_SECTION_REQUEST);

      expect(mockProfileSectionsModel.upsertProfileSections).toHaveBeenCalledTimes(1);
      expect(result.name).toEqual(CREATE_SECTION_REQUEST.name);
      expect(result.title).toEqual(CREATE_SECTION_REQUEST.title);
      expect(result.template).toEqual(SectionTemplates.COPY);
      expect(result.content).toEqual(CREATE_SECTION_REQUEST.content);
      expect(result.urlPath).toEqual(CREATE_SECTION_REQUEST.urlPath);
      expect(result.subNav).toEqual(CREATE_SECTION_REQUEST.subNav);
      expect(result.isHidden).toEqual(CREATE_SECTION_REQUEST.isHidden);
    });
    it('should throw 500 HttpException if any error occurs while creating profile section', async () => {
      (mockProfileSectionTemplatesService.getProfileSectionTemplatesByNames as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsService.createProfileSection(CREATE_SECTION_REQUEST);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('createProfileSections', () => {
    it('should successfully create profile sections for each template', async () => {
      (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mockImplementation((sections: ProfileSectionEntity[]) => {
        return sections.map((section, index) => ({
          restaurantProfileSectionID: index + 1,
          ...section,
        }));
      });

      const result = await profileSectionsService.createProfileSections(PROFILE_SECTION_ENTITIES);

      expect(mockProfileSectionsModel.upsertProfileSections).toHaveBeenCalledTimes(1);
      validateProfileSectionEntities(result);
    });
    it('should throw 500 HttpException if any error occurs while creating profile sections', async () => {
      (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsService.createProfileSections(PROFILE_SECTION_ENTITIES);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editProfileSection', () => {
    const SECTION_ID = 123;
    it.each([
      {
        name: 'with all values',
        editRequest: {
          sectionID: SECTION_ID,
          name: 'edited name',
          title: 'edited title',
          content: 'edited content',
          urlPath: 'edited-path',
          subNav: 'edited nav',
          isHidden: false,
          template: SectionTemplates.COPY,
        },
      },
      {
        name: 'by removing optional values',
        editRequest: {
          sectionID: SECTION_ID,
          title: '',
          content: '',
          urlPath: '',
          subNav: '',
          template: SectionTemplates.COPY,
        },
      },
      { name: 'with only name value', editRequest: { sectionID: SECTION_ID, name: 'edited name', template: SectionTemplates.COPY } },
      { name: 'with only title value', editRequest: { sectionID: SECTION_ID, title: 'edited title', template: SectionTemplates.COPY } },
      { name: 'with only content value', editRequest: { sectionID: SECTION_ID, content: 'edited content', template: SectionTemplates.COPY } },
      { name: 'with only urlPath value', editRequest: { sectionID: SECTION_ID, urlPath: 'edited-path', template: SectionTemplates.COPY } },
      { name: 'with only subNav value', editRequest: { sectionID: SECTION_ID, subNav: 'edited nav', template: SectionTemplates.COPY } },
      { name: 'with only isHidden value', editRequest: { sectionID: SECTION_ID, isHidden: true, template: SectionTemplates.COPY } },
    ])('should successfully edit profile section $name', async ({ editRequest }: { name: string; editRequest: ProfileSectionInterface }) => {
      (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mockResolvedValue(undefined);

      await profileSectionsService.editProfileSection(editRequest);

      expect(mockProfileSectionsModel.upsertProfileSections).toHaveBeenCalledTimes(1);

      // Get the arguments passed to the mocked function
      const calledWith = (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mock.calls[0][0][0];

      // Always expect the restaurantProfileSectionID to be set
      expect(calledWith.restaurantProfileSectionID).toBe(SECTION_ID);

      // Check for optional properties
      if (editRequest.name) {
        expect(calledWith.name).toBe(editRequest.name);
      }
      if (editRequest.title !== undefined) {
        expect(calledWith.title).toBe(editRequest.title === '' ? null : editRequest.title);
      }
      if (editRequest.content !== undefined) {
        expect(calledWith.content).toBe(editRequest.content === '' ? null : editRequest.content);
      }
      if (editRequest.urlPath !== undefined) {
        expect(calledWith.urlPath).toBe(editRequest.urlPath === '' ? null : editRequest.urlPath);
      }
      if (editRequest.subNav !== undefined) {
        expect(calledWith.subNav).toBe(editRequest.subNav === '' ? null : editRequest.subNav);
      }
      if (editRequest.isHidden !== undefined) {
        expect(calledWith.isHidden).toBe(editRequest.isHidden);
      }

      // Reset the mock after each test
      (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mockReset();
    });
    it('should throw 500 HttpException if any error occurs while editing profile section', async () => {
      (mockProfileSectionsModel.upsertProfileSections as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsService.editProfileSection({} as ProfileSectionInterface);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteProfileSection', () => {
    const sectionID = 1;
    it('should successfully delete profile section', async () => {
      await profileSectionsService.deleteProfileSection(sectionID);

      expect(mockProfileSectionsModel.softDeleteProfileSection).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while deleting profile section', async () => {
      (mockProfileSectionsModel.softDeleteProfileSection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await profileSectionsService.deleteProfileSection(sectionID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('linkMedia', () => {
    const RESTAURANT_ID = 1;
    const MEDIA_IDs = [1, 2];
    const SECTION_ID = 1;
    const mockMedia = [
      new MediaEntity('image1.jpeg', IMAGE_TYPE_ID, RESTAURANT_ID, 'some_image', 1),
      new MediaEntity('image2.jpeg', IMAGE_TYPE_ID, RESTAURANT_ID, null, 2),
    ];
    it('should successfully link media to a profile page section', async () => {
      (mockMediaLibraryService.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMedia);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await profileSectionsService.linkMedia(MEDIA_IDs, RESTAURANT_ID, SECTION_ID);

      expect(mockMediaLibraryService.getMediaByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockMediaLibraryService.getMediaByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 400 Bad Request HttpException if any media id in request does not exist for restaurant', async () => {
      (mockMediaLibraryService.getMediaByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMedia);

      try {
        await profileSectionsService.linkMedia([...MEDIA_IDs, 3], RESTAURANT_ID, SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 500 HttpException if any error occurs while creating profile sections', async () => {
      (mockMediaLibraryService.getMediaByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsService.linkMedia(MEDIA_IDs, RESTAURANT_ID, SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteCard', () => {
    const cardID = 1;
    it('should successfully delete card from the profile page section', async () => {
      (mockProfileCardsService.deleteCard as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await profileSectionsService.deleteCard(cardID);

      expect(mockProfileCardsService.deleteCard).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while deleting profile section card', async () => {
      (mockProfileCardsService.deleteCard as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await profileSectionsService.deleteCard(cardID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('createCard', () => {
    const RESTAURANT_PROFILE_SECTION_ID = 2;
    const SECTION_ID = 2;
    const CARD: CreateProfileSectionCardsDto = {
      sectionID: SECTION_ID,
      title: 'test title',
      content: 'test content',
      subtitle: 'test subtitle',
      linkURL: 'test link',
    };
    const mockCard = new ProfileCardsEntity(
      {
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      },
      RESTAURANT_PROFILE_SECTION_ID,
    );
    it('should successfully upsert card to a profile page section', async () => {
      (mockProfileCardsService.upsertCard as jest.MockedFunction<any>).mockResolvedValueOnce(mockCard);

      await profileSectionsService.createCard(CARD);

      expect(mockProfileCardsService.upsertCard).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while upserting profile section card', async () => {
      (mockProfileCardsService.upsertCard as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsService.createCard(CARD);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editCard', () => {
    const CARD_ID = 1;
    const CARD: EditProfileSectionCardsDto = {
      cardID: CARD_ID,
      title: 'test title',
      content: 'test content',
      subtitle: 'test subtitle',
      linkURL: 'test link',
    };
    const mockCard: Partial<ProfileCardsEntity> = {
      restaurantProfileSectionCardID: CARD_ID,
      title: 'test title',
      content: 'test content',
      subtitle: 'test subtitle',
      linkURL: 'test link',
    };
    it('should successfully upsert card to a profile page section', async () => {
      await profileSectionsService.editCard(CARD);

      expect(mockProfileCardsService.upsertCard).toHaveBeenCalledTimes(1);
      expect(mockProfileCardsService.upsertCard).toHaveBeenCalledWith(mockCard);
    });
    it('should throw 500 HttpException if any error occurs while upserting profile section card', async () => {
      (mockProfileCardsService.upsertCard as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsService.editCard(CARD);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProfileCardsService.upsertCard).toHaveBeenCalledTimes(1);
      expect(mockProfileCardsService.upsertCard).toHaveBeenCalledWith(mockCard);
    });
  });
});
