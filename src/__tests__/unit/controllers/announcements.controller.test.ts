import { NextFunction, Request, Response } from 'express-serve-static-core';
import AnnouncementsController from '@controllers/announcements.controller';
import AnnouncementsService from '@services/announcements.service';
import { RestaurantAddressServiceInterface } from '@interfaces/restaurantAddress.interface';
import {
  AnnouncementsModelInterface,
  CreateAnnouncementRequestInterface,
  CreateAnnouncementResponseInterface,
  EditAnnouncementRequestInterface,
  AnnouncementStatusResponseInterface,
  HideAnnouncementRequestInterface,
  GetAnnouncementsResponseInterface,
  LinkAnnouncementToMediaRequestInterface,
} from '@interfaces/announcements.interface';
import { AnnouncementImageResponseInterface, AnnouncementImagesServiceInterface } from '@interfaces/announcementImages.interface';
import { deleteImageIfExists } from '@utils/imageUtils';

jest.mock('@/utils/imageUtils', () => {
  return { __esModule: true, deleteImageIfExists: jest.fn() };
});
jest.mock('@/services/announcements.service', () => {
  const mockAnnouncementsService = {
    createAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
    editAnnouncement: jest.fn(),
    getAnnouncementsByRestaurantID: jest.fn(),
    hideAnnouncement: jest.fn(),
    linkAnnouncementToMedia: jest.fn(),
    uploadAnnouncementImage: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAnnouncementsService) };
});

const mockAnnouncementsService = new AnnouncementsService(
  {} as AnnouncementImagesServiceInterface,
  {} as RestaurantAddressServiceInterface,
  {} as AnnouncementsModelInterface,
);
const announcementsController = new AnnouncementsController(mockAnnouncementsService);

describe('announcementsController', () => {
  const RESTAURANT_ID = 2;
  const ANNOUNCEMENT_ID = 123;
  const ANNOUNCEMENT_STATUS_RESPONSE = {
    active: true,
  } as AnnouncementStatusResponseInterface;

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createAnnouncement', () => {
    const CREATE_ANNOUNCEMENT_REQUEST = {
      name: 'Test Announcement Name',
      title: 'Test Announcement Title',
      description: 'Test Announcement description',
      startDate: '2021-07-17 14:47:02.865110',
      endDate: '2022-07-17 14:47:02.865110',
      submitEmail: false,
    } as CreateAnnouncementRequestInterface;
    it('should successfully create announcement', async () => {
      const CREATE_ANNOUNCEMENT_RESPONSE = {
        announcementID: 1,
        hidden: false,
        active: true,
        ...CREATE_ANNOUNCEMENT_REQUEST,
      } as CreateAnnouncementResponseInterface;
      const mReq = {
        body: CREATE_ANNOUNCEMENT_REQUEST,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockAnnouncementsService.createAnnouncement as jest.MockedFunction<any>).mockResolvedValueOnce(CREATE_ANNOUNCEMENT_RESPONSE);

      await announcementsController.createAnnouncement(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.createAnnouncement).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(CREATE_ANNOUNCEMENT_RESPONSE);
    });
    it('should not create announcement because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await announcementsController.createAnnouncement(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.createAnnouncement).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteAnnouncement', () => {
    it('should successfully delete announcement', async () => {
      const mReq = {
        params: {
          announcementID: 1000,
        },
      } as unknown;
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      await announcementsController.deleteAnnouncement(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.deleteAnnouncement).toHaveBeenCalledTimes(1);
    });
    it('should not delete announcement because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await announcementsController.deleteAnnouncement(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.deleteAnnouncement).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editAnnouncement', () => {
    const EDIT_ANNOUNCEMENT_REQUEST = {
      announcementID: ANNOUNCEMENT_ID,
      name: 'Test Announcement Name',
      title: 'Test Announcement Title',
      description: 'Test Announcement description',
      startDate: '2021-07-17 14:47:02.865110',
      endDate: '2022-07-17 14:47:02.865110',
      submitEmail: false,
    } as EditAnnouncementRequestInterface;
    it('should successfully edit announcement', async () => {
      const mReq = {
        body: EDIT_ANNOUNCEMENT_REQUEST,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockAnnouncementsService.editAnnouncement as jest.MockedFunction<any>).mockResolvedValueOnce(ANNOUNCEMENT_STATUS_RESPONSE);

      await announcementsController.editAnnouncement(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.editAnnouncement).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(ANNOUNCEMENT_STATUS_RESPONSE);
    });
    it('should not edit announcement because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await announcementsController.editAnnouncement(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.editAnnouncement).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getAnnouncements', () => {
    it('should successfully get announcements for restaurant', async () => {
      const GET_ANNOUNCEMENT_RESPONSE = {
        announcementID: 1,
        name: 'Test',
        title: 'Test title',
        description: 'Test description',
        image: {
          imageID: 1,
          imageURL: 'test.png',
        },
        startDate: '2021-07-17 14:47:02.865110',
        endDate: '2022-07-17 14:47:02.865110',
        hidden: true,
        submitEmail: false,
        active: false,
      } as GetAnnouncementsResponseInterface;
      (mockAnnouncementsService.getAnnouncementsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([GET_ANNOUNCEMENT_RESPONSE]);

      let responseObject = {};
      const mReq = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };

      await announcementsController.getAnnouncements(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.getAnnouncementsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual([GET_ANNOUNCEMENT_RESPONSE]);
    });
    it('should not get announcements because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await announcementsController.getAnnouncements(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.getAnnouncementsByRestaurantID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('hideAnnouncement', () => {
    const HIDE_ANNOUNCEMENT_REQUEST = {
      announcementID: ANNOUNCEMENT_ID,
      hide: true,
    } as HideAnnouncementRequestInterface;
    it('should successfully show announcement', async () => {
      const SHOW_ANNOUNCEMENT_REQUEST = {
        announcementID: ANNOUNCEMENT_ID,
        hide: false,
      } as HideAnnouncementRequestInterface;
      const mReq = {
        body: SHOW_ANNOUNCEMENT_REQUEST,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockAnnouncementsService.hideAnnouncement as jest.MockedFunction<any>).mockResolvedValueOnce(ANNOUNCEMENT_STATUS_RESPONSE);

      await announcementsController.hideAnnouncement(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.hideAnnouncement).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(ANNOUNCEMENT_STATUS_RESPONSE);
    });
    it('should successfully hide announcement', async () => {
      const INACTIVE_ANNOUNCEMENT_RESPONSE = {
        active: true,
      } as AnnouncementStatusResponseInterface;
      const mReq = {
        body: HIDE_ANNOUNCEMENT_REQUEST,
      };
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      (mockAnnouncementsService.hideAnnouncement as jest.MockedFunction<any>).mockResolvedValueOnce(INACTIVE_ANNOUNCEMENT_RESPONSE);

      await announcementsController.hideAnnouncement(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.hideAnnouncement).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(INACTIVE_ANNOUNCEMENT_RESPONSE);
    });
    it('should not hide announcement because of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await announcementsController.hideAnnouncement(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.hideAnnouncement).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkAnnouncementToMedia', () => {
    const LINK_ANNOUNCEMENT_REQUEST = {
      announcementID: ANNOUNCEMENT_ID,
      mediaIDs: [1, 2, 3],
    } as LinkAnnouncementToMediaRequestInterface;
    it('should successfully link announcement to media', async () => {
      const mReq = {
        body: LINK_ANNOUNCEMENT_REQUEST,
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1, media: [{ media_id: 123 }] },
      };
      (mockAnnouncementsService.linkAnnouncementToMedia as jest.MockedFunction<any>).mockResolvedValueOnce(ANNOUNCEMENT_STATUS_RESPONSE);

      await announcementsController.linkAnnouncementToMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockAnnouncementsService.linkAnnouncementToMedia).toHaveBeenCalledTimes(1);
    });
    it('should not link announcement to mediabecause of invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await announcementsController.linkAnnouncementToMedia(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.linkAnnouncementToMedia).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('uploadAnnouncementImage', () => {
    const IMAGE_NAME = 'df94-34ds-23f3-dfsr.jpeg';
    const ANNOUNCEMENT_ID = 123;
    it('should successfully upload announcement image', async () => {
      const mReq = {
        body: {
          imagesToDelete: '[]',
          announcementID: `${ANNOUNCEMENT_ID}}`,
        },
        files: {
          image: [{ filename: IMAGE_NAME }],
        },
      } as unknown;
      const imageUploadResponse = {
        imageID: 12,
        imageURL: 'test_image.png',
      } as AnnouncementImageResponseInterface;

      (mockAnnouncementsService.uploadAnnouncementImage as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await announcementsController.uploadAnnouncementImage(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockAnnouncementsService.uploadAnnouncementImage).toHaveBeenCalledWith(IMAGE_NAME, ANNOUNCEMENT_ID, [], RESTAURANT_ID);
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully delete announcement images when ids are provided in request', async () => {
      const mReq = {
        body: {
          imagesToDelete: '[1,2]',
          announcementID: `${ANNOUNCEMENT_ID}}`,
        },
        files: {},
      } as unknown;

      (mockAnnouncementsService.uploadAnnouncementImage as jest.MockedFunction<any>).mockResolvedValueOnce(null);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await announcementsController.uploadAnnouncementImage(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockAnnouncementsService.uploadAnnouncementImage).toHaveBeenCalledWith(undefined, ANNOUNCEMENT_ID, [1, 2], RESTAURANT_ID);
      expect(responseObject).toEqual({});
    });
    it('should throw 400 Bad Request if imagesToDelete is not an array of numbers when trying to delete announcement image', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          imagesToDelete: '["test"]',
          announcementID: `${ANNOUNCEMENT_ID}}`,
        },
        files: {
          image: [{ filename: IMAGE_NAME }],
        },
      } as unknown;

      await announcementsController.uploadAnnouncementImage(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.uploadAnnouncementImage).not.toHaveBeenCalled();
      expect(deleteImageIfExists).toHaveBeenCalledWith(IMAGE_NAME);
      expect(mNext).toHaveBeenCalled();
    });
    it('should throw 400 Bad Request if announcementID provided is not a number when trying to upload announcement image', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          imagesToDelete: '[]',
          announcementID: 'test',
        },
        files: {
          image: [{ filename: IMAGE_NAME }],
        },
      } as unknown;

      await announcementsController.uploadAnnouncementImage(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockAnnouncementsService.uploadAnnouncementImage).not.toHaveBeenCalled();
      expect(deleteImageIfExists).toHaveBeenCalledWith(IMAGE_NAME);
      expect(mNext).toHaveBeenCalled();
    });
    it('should delete image for announcement if an exception occurs when uploading image', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          imagesToDelete: '[]',
          announcementID: `${ANNOUNCEMENT_ID}}`,
        },
        files: {
          image: [{ filename: IMAGE_NAME }],
        },
      } as unknown;

      (mockAnnouncementsService.uploadAnnouncementImage as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await announcementsController.uploadAnnouncementImage(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockAnnouncementsService.uploadAnnouncementImage).toHaveBeenCalledTimes(1);
      expect(deleteImageIfExists).toHaveBeenCalledWith(IMAGE_NAME);
      expect(mNext).toHaveBeenCalled();
    });
  });
});
