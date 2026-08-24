import { NextFunction, Request, Response } from 'express-serve-static-core';
import ProfilePagesService from '@services/profilePages.service';
import { ProfileSectionsServiceInterface } from '@interfaces/profileSections.interface';
import {
  CreateProfilePageRequestInterface,
  CreateProfilePageResponseInterface,
  EditProfilePageRequestInterface,
  ProfilePagesModelInterface,
} from '@interfaces/profilePages.interface';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import ProfilePagesController from '@controllers/profilePages.controller';
import { SectionTemplates } from '@/enums/sectionTemplates';

jest.mock('@/services/profilePages.service', () => {
  const mockProfilePagesService = {
    createProfilePage: jest.fn(),
    editProfilePage: jest.fn(),
    getProfilePageDetails: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfilePagesService) };
});

const mockProfilePagesService = new ProfilePagesService({} as ProfileSectionsServiceInterface, {} as ProfilePagesModelInterface);
const profilePagesController = new ProfilePagesController(mockProfilePagesService);

describe('profilePagesController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const CREATE_PROFILE_REQUEST = {
    name: 'Test Name',
    title: 'Test title',
    seoTitle: 'Test SEO title',
    seoDescription: 'Test SEO description',
    urlPath: 'url-path',
    navLink: 'Test Link',
    isHidden: true,
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
  } as CreateProfilePageRequestInterface;
  describe('createProfilePage', () => {
    it('should successfully create profile page', async () => {
      const mockServiceResponse: CreateProfilePageResponseInterface = {
        ...CREATE_PROFILE_REQUEST,
        pageID: 1,
      };
      const mReq = {
        body: CREATE_PROFILE_REQUEST,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockProfilePagesService.createProfilePage as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      await profilePagesController.createProfilePage(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfilePagesService.createProfilePage).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create profile page because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profilePagesController.createProfilePage(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfilePagesService.createProfilePage).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editProfilePage', () => {
    const EDIT_PROFILE_REQUEST = {
      pageID: 123,
      name: 'Test Name',
      title: 'Test title',
      seoTitle: 'Test SEO title',
      seoDescription: 'Test SEO description',
      urlPath: 'url-path',
      navLink: 'Test Link',
      isHidden: true,
    } as EditProfilePageRequestInterface;
    it('should successfully edit profile page', async () => {
      const mockServiceResponse: EditProfilePageRequestInterface = {
        ...EDIT_PROFILE_REQUEST,
        pageID: 1,
      };
      const mReq = {
        body: EDIT_PROFILE_REQUEST,
        metadata: {} as ProfilePageEntity,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockProfilePagesService.editProfilePage as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      await profilePagesController.editProfilePage(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfilePagesService.editProfilePage).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not edit profile page because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profilePagesController.editProfilePage(mReq as CustomRequest<ProfilePageEntity>, mRes as Response, mNext as NextFunction);
      expect(mockProfilePagesService.editProfilePage).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getProfilePageDetails', () => {
    it('should successfully get profile page details', async () => {
      const mockServiceResponse: CreateProfilePageResponseInterface = {
        ...CREATE_PROFILE_REQUEST,
        pageID: 1,
      };
      const mReq: Partial<Request> = {
        params: {
          pageID: '1',
        },
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockProfilePagesService.getProfilePageDetails as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);
      await profilePagesController.getProfilePageDetails(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockProfilePagesService.getProfilePageDetails).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not get profile page details because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await profilePagesController.getProfilePageDetails(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockProfilePagesService.getProfilePageDetails).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
