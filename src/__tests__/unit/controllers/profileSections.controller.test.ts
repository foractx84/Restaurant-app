import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CreateProfileSectionRequest, ProfileSectionInterface, ProfileSectionsModelInterface } from '@interfaces/profileSections.interface';
import { SectionTemplates } from '@/enums/sectionTemplates';
import ProfileSectionsService from '@services/profileSections.service';
import ProfileSectionTemplatesService from '@services/profileSectionTemplates.service';
import ProfileSectionsController from '@controllers/profileSections.controller';
import { MediaLibraryServiceInterface } from '@/interfaces/mediaLibrary.interface';
import { RestaurantProfileMediaServiceInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { CreateProfileSectionCardsDto, EditProfileSectionCardsDto, LinkRestaurantProfileSectionMediaDto } from '@/dtos/profileSections.dto';
import { ProfileCardsServiceInterface, RestaurantProfileSectionCardsInterface } from '@/interfaces/profileCards.interface';
import { LinkMediaToProfileCardDto } from '@/dtos/profileCardMedia.dto';

jest.mock('@/services/profileSections.service', () => {
  const mockProfileSectionsService = {
    createCard: jest.fn(),
    editCard: jest.fn(),
    deleteCard: jest.fn(),
    createProfileSection: jest.fn(),
    editProfileSection: jest.fn(),
    deleteProfileSection: jest.fn(),
    linkMedia: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionsService) };
});

const mockProfileSectionsService = new ProfileSectionsService(
  {} as ProfileSectionTemplatesService,
  {} as ProfileSectionsModelInterface,
  {} as MediaLibraryServiceInterface,
  {} as RestaurantProfileMediaServiceInterface,
  {} as ProfileCardsServiceInterface,
);
const profileSectionsController = new ProfileSectionsController(mockProfileSectionsService);

describe('profileSectionsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createProfileSection', () => {
    const CREATE_PROFILE_SECTION_REQUEST: CreateProfileSectionRequest = {
      pageID: 223,
      name: 'Test Copy Section',
      title: 'Test title',
      content: 'Test content',
      template: SectionTemplates.COPY,
      urlPath: 'copy-path',
      subNav: 'Copy Link',
      isHidden: false,
    };
    it('should successfully create profile page section', async () => {
      const mockServiceResponse: ProfileSectionInterface = {
        ...CREATE_PROFILE_SECTION_REQUEST,
        sectionID: 1,
      };
      const mReq = {
        body: CREATE_PROFILE_SECTION_REQUEST,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockProfileSectionsService.createProfileSection as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      await profileSectionsController.createProfileSection(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfileSectionsService.createProfileSection).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create profile page section because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.createProfileSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.createProfileSection).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editProfileSection', () => {
    const EDIT_PROFILE_SECTION_REQUEST: ProfileSectionInterface = {
      sectionID: 223,
      name: 'Test Copy Section',
      title: 'Test title',
      content: 'Test content',
      template: SectionTemplates.COPY,
      urlPath: 'copy-path',
      subNav: 'Copy Link',
      isHidden: false,
    };
    it('should successfully edit profile page section', async () => {
      const mReq = {
        body: EDIT_PROFILE_SECTION_REQUEST,
      };
      const mRes: Partial<Response> = {
        sendStatus: jest.fn(),
        locals: { restaurantID: 1 },
      };
      (mockProfileSectionsService.editProfileSection as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await profileSectionsController.editProfileSection(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfileSectionsService.editProfileSection).toHaveBeenCalledTimes(1);
    });
    it('should not edit profile page section because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.editProfileSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.editProfileSection).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteProfileSection', () => {
    it('should successfully delete restaurant profile page section', async () => {
      const mReq: Partial<Request> = {
        params: {
          sectionID: '1',
        },
      };
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
      };
      const mNext = jest.fn();
      await profileSectionsController.deleteProfileSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.deleteProfileSection).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not delete restaurant profile page section because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.deleteProfileSection(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.deleteProfileSection).not.toHaveBeenCalled();
    });
  });
  describe('linkMedia', () => {
    const LINK_RESTAURANT_PROFILE_SECTION_MEDIA: LinkRestaurantProfileSectionMediaDto = {
      sectionID: 223,
      mediaIDs: [1, 2],
    };
    const RESTAURANT_ID = 1;
    it('should successfully link media to profile page section', async () => {
      const mReq = {
        body: LINK_RESTAURANT_PROFILE_SECTION_MEDIA,
      };
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };

      await profileSectionsController.linkMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfileSectionsService.linkMedia).toHaveBeenCalledTimes(1);
      expect(mockProfileSectionsService.linkMedia).toHaveBeenCalledWith(
        LINK_RESTAURANT_PROFILE_SECTION_MEDIA.mediaIDs,
        RESTAURANT_ID,
        LINK_RESTAURANT_PROFILE_SECTION_MEDIA.sectionID,
      );
    });
    it('should not link media to profile page section because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.linkMedia(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.linkMedia).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteCard', () => {
    it('should successfully delete restaurant profile page section card of profile page section', async () => {
      const mReq: Partial<Request> = {
        params: {
          cardID: '1',
        },
      };
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
      };
      const mNext = jest.fn();
      await profileSectionsController.deleteCard(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.deleteCard).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not delete restaurant profile page section card because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.deleteCard(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.deleteCard).not.toHaveBeenCalled();
    });
  });
  describe('createCard', () => {
    const SECTION_ID = 1;
    const CARD: CreateProfileSectionCardsDto = {
      sectionID: SECTION_ID,
      title: 'test title',
      content: 'test content',
      subtitle: 'test subtitle',
      linkURL: 'test link',
    };
    const mockServiceResponse: RestaurantProfileSectionCardsInterface = {
      cardID: 2,
      title: 'test title',
      content: 'test content',
      subtitle: 'test subtitle',
      linkURL: 'test link',
    };
    const RESTAURANT_ID = 2;
    it('should successfully create restaurant profile page section card of profile page section', async () => {
      const mReq = {
        body: CARD,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };
      (mockProfileSectionsService.createCard as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      await profileSectionsController.createCard(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfileSectionsService.createCard).toHaveBeenCalledTimes(1);
      expect(mockProfileSectionsService.createCard).toHaveBeenCalledWith(CARD);

      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create restaurant profile page section card because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.createCard(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.createCard).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
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
    const RESTAURANT_ID = 2;
    it('should successfully edit restaurant profile page section card of profile page section', async () => {
      const mReq = {
        body: CARD,
      };
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };

      await profileSectionsController.editCard(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfileSectionsService.editCard).toHaveBeenCalledTimes(1);
      expect(mockProfileSectionsService.editCard).toHaveBeenCalledWith(CARD);
    });
    it('should not edit restaurant profile page section card because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profileSectionsController.editCard(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfileSectionsService.editCard).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('linkMediaToProfileCard', () => {
    const LINK_MEDIA_TO_PROFILE_CARD_REQUEST: LinkMediaToProfileCardDto = {
      mediaID: 1,
      cardID: 1,
    };

    it('should successfully link media to profile page section card', async () => {
      const mReq = {
        body: LINK_MEDIA_TO_PROFILE_CARD_REQUEST,
      };

      const mRes: Partial<Response> = {
        sendStatus: jest.fn(),
      };

      const mockProfileSectionsService = {
        linkMediaToProfileCard: jest.fn().mockResolvedValueOnce(undefined),
      };

      const profileSectionsController = new ProfileSectionsController(mockProfileSectionsService as any);

      await profileSectionsController.linkMediaToProfileCard(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockProfileSectionsService.linkMediaToProfileCard).toHaveBeenCalledTimes(1);
      expect(mockProfileSectionsService.linkMediaToProfileCard).toHaveBeenCalledWith(1, 1);
      expect(mRes.sendStatus).toHaveBeenCalledWith(200);
    });

    it('should not link media to profile page section card because of invalid request', async () => {
      const mReq = undefined;

      const mRes = {} as Partial<Response>;

      const mockNext = jest.fn();

      const mockProfileSectionsService = {
        linkMediaToProfileCard: jest.fn(),
      };

      const profileSectionsController = new ProfileSectionsController(mockProfileSectionsService as any);

      await profileSectionsController.linkMediaToProfileCard(mReq as Request, mRes as Response, mockNext as NextFunction);

      expect(mockProfileSectionsService.linkMediaToProfileCard).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
