import RestaurantAddressService from '@services/restaurantAddress.service';
import { RestaurantAddressModelInterface } from '@interfaces/restaurantAddress.interface';
import AnnouncementsService from '@services/announcements.service';
import AnnouncementsModel from '@/models/announcements.model';
import { getCurrentTimeForTimeZone } from '@utils/timeUtils';
import {
  CreateAnnouncementRequestInterface,
  CreateAnnouncementResponseInterface,
  EditAnnouncementRequestInterface,
  HideAnnouncementRequestInterface,
  LinkAnnouncementToMediaRequestInterface,
} from '@interfaces/announcements.interface';
import { AnnouncementEntity } from '@/entities/announcement.entity';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import AnnouncementImagesService from '@services/announcementImages.service';
import { AnnouncementImagesModelInterface } from '@interfaces/announcementImages.interface';
import { ormConnection } from '@utils/dbUtils';
import { AnnouncementType } from '@/enums/announcementType';

jest.mock('@/models/announcements.model', () => {
  const mockAnnouncementsModel = {
    insertAnnouncement: jest.fn(),
    fetchAnnouncementByID: jest.fn(),
    fetchAnnouncementsByRestaurantIDOrNameOrID: jest.fn(),
    hideAnnouncement: jest.fn(),
    softDeleteAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAnnouncementsModel) };
});
jest.mock('@/services/restaurantAddress.service', () => {
  const mockRestaurantAddressService = {
    getRestaurantAddressByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantAddressService) };
});
jest.mock('@/services/announcementImages.service', () => {
  const mockRestaurantImagesService = {
    deleteImages: jest.fn(),
    getAnnouncementImagesByAnnouncementID: jest.fn(),
    insertAnnouncementImage: jest.fn(),
    validateImagesToDelete: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantImagesService) };
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
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'https://dummy_image.jpeg',
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});

const mockAnnouncementImagesService = new AnnouncementImagesService({} as AnnouncementImagesModelInterface);
const mockRestaurantAddressService = new RestaurantAddressService({} as RestaurantAddressModelInterface);
const mockAnnouncementsModel = new AnnouncementsModel();
const announcementsService = new AnnouncementsService(mockAnnouncementImagesService, mockRestaurantAddressService, mockAnnouncementsModel);

const EST_TIMEZONE = 'America/New_York';

describe('announcementsService', () => {
  const RESTAURANT_ID = 1;
  afterEach(() => {
    jest.resetAllMocks();
  });

  const getStartDate = (): Date => {
    const startDate = getCurrentTimeForTimeZone('en-US', EST_TIMEZONE);
    const startMonth = startDate.getMonth();

    if (startMonth === 0) {
      startDate.setMonth(-1);
      startDate.setMonth(10);
    } else {
      startDate.setMonth(startMonth - 2);
    }

    return startDate;
  };
  const getEndDate = (isActive: boolean): Date => {
    const endDate = getCurrentTimeForTimeZone('en-US', EST_TIMEZONE);
    const endMonth = endDate.getMonth();
    if (isActive) {
      endDate.setMonth(endMonth + 1);
    } else {
      endDate.setMonth(endMonth - 1);
    }

    return endDate;
  };
  const buildCreateAnnouncementRequest = (isActive: boolean, announcementType = AnnouncementType.MODAL): CreateAnnouncementRequestInterface => {
    const request = {
      name: 'Test Name',
      title: 'Test Title',
      description: 'Test description',
      startDate: getStartDate().toISOString().replace('Z', ''),
      endDate: getEndDate(isActive).toISOString().replace('Z', ''),
      type: announcementType,
      submitEmail: false,
    };
    if (request.type === AnnouncementType.EMBED) {
      delete request.title;
      delete request.description;
    }
    return request;
  };

  const buildEditAnnouncementRequest = (announcementID: number, isActive: boolean, name = 'test'): EditAnnouncementRequestInterface => {
    const createRequest = buildCreateAnnouncementRequest(isActive);
    return {
      announcementID,
      description: createRequest.description,
      endDate: createRequest.endDate,
      name: name || null,
      startDate: createRequest.startDate,
      title: createRequest.title,
      type: createRequest.type,
      submitEmail: false,
    };
  };

  // takes the given timestamp and offsets it by N months based on the offsetMonth parameter
  // 2022-10-02T10:49:00.000 with offsetMonth = 1 -> 2022-11-02T10:51:01.000
  // 2022-10-02T10:49:00.000 with offsetMonth = -1 -> 2022-09-02T10:51:20.000
  // 2022-10-02T10:49:00.000 with offsetMonth = 3 -> 2023-01-02T10:50:04.000
  // 2022-10-02T10:49:00.000 with offsetMonth = -11 -> 2021-11-02T10:50:37.000
  const buildOverlappingTimeSpanTest = (timestamp: string, offsetMonth: number) => {
    const date = new Date(timestamp);
    return new Date(date.setMonth(date.getMonth() + offsetMonth)).toISOString().replace('Z', '');
  };

  describe('createAnnouncement', () => {
    const ANNOUNCEMENT_ID = 123;
    const buildCreateAnnouncementResponse = (
      request: CreateAnnouncementRequestInterface,
      isActive: boolean,
      hidden = false,
      announcementType = AnnouncementType.MODAL,
      submitEmail = false,
    ): CreateAnnouncementResponseInterface => ({
      announcementID: ANNOUNCEMENT_ID,
      name: request.name,
      title: request.title || '',
      description: request.description || '',
      startDate: request.startDate,
      endDate: request.endDate,
      hidden: hidden,
      active: isActive,
      type: announcementType,
      submitEmail,
    });
    const mockAlreadyCreatedActiveAnnouncement = [
      {
        announcement_id: 1,
        name: 'Test name',
        title: 'Test title',
        description: 'Test description',
        start_date: getStartDate(),
        end_date: getEndDate(true),
        hidden: false,
        restaurant_id: 1,
        submit_email: false,
        announcement_type: {
          type: 'modal',
        },
        restaurant: {
          restaurant_address: {
            timezone: 'America/New_York',
          },
        },
      },
    ];
    it('should successfully create announcement with active status', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce([] as any);
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });

      const request = buildCreateAnnouncementRequest(true);

      const result = await announcementsService.createAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buildCreateAnnouncementResponse(request, true));
    });
    it('should successfully create announcement with inactive status', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce([] as any);
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(false);

      const result = await announcementsService.createAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buildCreateAnnouncementResponse(request, false));
    });
    it('should successfully create announcement that has start time and end time before start time of another previously created, unhidden announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, -12); // subtract a year to start date so outside time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, -12); // subtract a year to end date so it is out of time spn

      const result = await announcementsService.createAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buildCreateAnnouncementResponse(request, false));
    });
    it('should successfully create announcement that has start time and end time after end time of another previously created, unhidden announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, 12); // add a year to start date so outside time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, 12); // add a year to end date so it is out of time spn

      const result = await announcementsService.createAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buildCreateAnnouncementResponse(request, false));
    });
    it('should successfully create announcement that has overlapping time spans of existing announcement BUT other existing announcement is hidden', async () => {
      mockAlreadyCreatedActiveAnnouncement[0]['hidden'] = true;

      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);

      const result = await announcementsService.createAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buildCreateAnnouncementResponse(request, true));

      mockAlreadyCreatedActiveAnnouncement[0]['hidden'] = false;
    });
    it('should successfully create an EMBED announcement that has overlapping time span of existing MODAL announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true, AnnouncementType.EMBED);

      const result = await announcementsService.createAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).toHaveBeenCalledTimes(1);
      expect(result).toEqual(buildCreateAnnouncementResponse(request, true, false, AnnouncementType.EMBED));
    });
    it('should throw 409 and fail to create announcement if announcement start time overlaps with another unhidden announcement time span', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, 1); // add a month to start date so within time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, 1); // add a month to end date so it is out of time spn

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).not.toHaveBeenCalled();
    });
    it('should throw 409 and fail to create announcement if announcement end time overlaps with another unhidden announcement time span', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, -1); // subtract a month from start date so it is outside time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, -1); // subtract a month from end date so it is within time span

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).not.toHaveBeenCalled();
    });
    it('should throw 409 and fail to create announcement if announcement start time and end time overlaps with another unhidden announcement time span', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, 1); // add a month from start date so it is within time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, -1); // subtract a month from end date so it is within time span

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).not.toHaveBeenCalled();
    });
    it('should throw 409 and fail to create announcement if announcement start time begins before other announcement start time and end time ends after other announcement end time', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, -1); // subtract a month from start date so it is outside time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, 1); // add a month from end date so it is outside time span

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).not.toHaveBeenCalled();
    });
    it('should throw 409 if drawer announcement is being created in same time span as modal type announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockAlreadyCreatedActiveAnnouncement,
      );
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({ timezone: EST_TIMEZONE });
      (mockAnnouncementsModel.insertAnnouncement as jest.MockedFunction<any>).mockImplementationOnce((announcement: AnnouncementEntity) => {
        return { ...announcement, hidden: false, announcement_id: ANNOUNCEMENT_ID };
      });

      const request = buildCreateAnnouncementRequest(true);
      request.startDate = buildOverlappingTimeSpanTest(request?.startDate, 0); // subtract a month from start date so it is outside time span
      request.endDate = buildOverlappingTimeSpanTest(request?.endDate, 0); // add a month from end date so it is outside time span

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.insertAnnouncement).not.toHaveBeenCalled();
    });
    it('should throw 409 Duplicate Resource HttpException if an announcement with same name exists for restaurant', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce([
        {
          announcement_id: ANNOUNCEMENT_ID,
          name: 'Test Name',
        },
      ] as any);

      const request = buildCreateAnnouncementRequest(false);

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 404 Not Found HttpException if restaurant address (used for time zone) doesnt exist for restaurant while creating announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce([] as any);
      const request = buildCreateAnnouncementRequest(false);

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 400 Bad Request HttpException if trying to create embed announcement with email submission', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce([] as any);
      const request = buildCreateAnnouncementRequest(false, AnnouncementType.EMBED);

      try {
        await announcementsService.createAnnouncement({ ...request, submitEmail: true }, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 500 HttpException if any error occurs while creating announcement', async () => {
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      const request = buildCreateAnnouncementRequest(false);

      try {
        await announcementsService.createAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editAnnouncement', () => {
    const ANNOUNCEMENT_ID = 123;
    it('should successfully edit modal announcement with active status', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 12),
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              submit_email: false,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ active: true });
    });
    it('should successfully edit modal announcement with active status with no name provided', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true, null);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 12),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledWith(RESTAURANT_ID, true, null, ANNOUNCEMENT_ID);
      expect(result).toEqual({ active: true });
    });
    it('should successfully edit modal announcement with inactive status due to start/end date', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              submit_email: false,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 12),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ active: false });
    });
    it('should successfully edit modal announcement with inactive status due to hidden status', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: true,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              submit_email: false,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 12),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ active: false });
    });
    it('should successfully edit modal announcement despite another embed announcement having the same time frame', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              submit_email: false,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
            {
              name: 'Another Announcement',
              hidden: false,
              announcement_id: 99999,
              restaurant_id: restaurantID,
              submit_email: false,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.EMBED,
              },
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ active: true });
    });
    it('should successfully edit modal announcement despite another HIDDEN modal announcement having the same time frame', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
            {
              name: 'Another Announcement',
              hidden: true,
              submit_email: false,
              announcement_id: 99999,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.EMBED,
              },
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ active: true });
    });
    it('should throw 409 if modal announcement has edited start time that overlaps with existing modal announcement time span', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, -12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
            {
              name: 'Another Announcement',
              hidden: false,
              submit_email: false,
              announcement_id: 99999,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      request.startDate = buildOverlappingTimeSpanTest(request.startDate, 12);
      request.endDate = buildOverlappingTimeSpanTest(request.endDate, 1);
      request.type = undefined;

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 if modal announcement has edited end time that overlaps with existing modal announcement with span', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, -12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, -12),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.EMBED,
              },
            },
            {
              name: 'Another Announcement',
              hidden: false,
              submit_email: false,
              announcement_id: 99999,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      request.startDate = buildOverlappingTimeSpanTest(request.startDate, 0);
      request.endDate = buildOverlappingTimeSpanTest(request.endDate, 12);
      request.type = undefined;

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 if modal announcement has edited start and end time that exist within existing modal announcement time span', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, -12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, -12),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.EMBED,
              },
            },
            {
              name: 'Another Announcement',
              hidden: false,
              submit_email: false,
              announcement_id: 99999,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      request.type = undefined;
      request.startDate = buildOverlappingTimeSpanTest(request.startDate, 12);
      request.endDate = buildOverlappingTimeSpanTest(request.endDate, 12);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 if modal announcement has edited start and end time that overlaps with existing modal announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, -12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, -12),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.EMBED,
              },
            },
            {
              name: 'Another Announcement',
              hidden: false,
              submit_email: false,
              announcement_id: 99999,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL,
              },
            },
          ];
        },
      );

      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      request.type = undefined;
      request.startDate = buildOverlappingTimeSpanTest(request.startDate, 0);
      request.endDate = buildOverlappingTimeSpanTest(request.endDate, 24);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
    });
    it('should throw 404 Not Found HttpException if announcement doesnt exist for id or name provided while editing announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => []);
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 401 Unauthorized HttpException if announcement doesnt exist for restaurant while editing announcement', async () => {
      const DIFF_RESTAURANT_ID = 123;
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: DIFF_RESTAURANT_ID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            },
          ];
        },
      );

      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 409 Duplicate Resource HttpException if an announcement with same name exists for restaurant', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: 'Test Name',
              hidden: true,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            },
            {
              name: name,
              hidden: true,
              submit_email: false,
              announcement_id: 543,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            },
          ];
        },
      );

      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 404 Not Found HttpException if restaurant address doesnt exist for restaurant while editing announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              restaurant: {},
            },
          ];
        },
      );
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw a 400 HttpException if announcement type is switched to EMBED without image', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              submit_email: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              start_date: buildOverlappingTimeSpanTest(request.startDate, -12),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL || AnnouncementType.DRAWER,
              },
              announcement_images: [],
            },
          ];
        },
      );

      try {
        await announcementsService.editAnnouncement({ ...request, type: AnnouncementType.EMBED }, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });

    it('should successfully ignore setting submitEmail to false passed in request and keep as true based on mock response, if switching from modal / drawer to embed announcement', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              submit_email: true,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL || AnnouncementType.DRAWER,
              },
              announcement_images: ['image1', 'image2'],
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement({ ...request, type: AnnouncementType.EMBED, submitEmail: false }, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.updateAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          submit_email: true,
        }),
      );
      expect(result).toEqual({ active: true });
    });

    it('should successfully ignore setting submitEmail to true passed in request and keep as true based on mock response, if switching from modal / drawer to embed announcement', async () => {
      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, true);
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              submit_email: false,
              start_date: buildOverlappingTimeSpanTest(request.startDate, 0),
              end_date: buildOverlappingTimeSpanTest(request.endDate, 0),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_type: {
                type: AnnouncementType.MODAL || AnnouncementType.DRAWER,
              },
              announcement_images: ['image1', 'image2'],
            },
          ];
        },
      );

      const result = await announcementsService.editAnnouncement({ ...request, type: AnnouncementType.EMBED, submitEmail: true }, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.updateAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          submit_email: false,
        }),
      );
      expect(result).toEqual({ active: true });
    });
    it('should throw 500 HttpException if any error occurs while editing announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      const request = buildEditAnnouncementRequest(ANNOUNCEMENT_ID, false);

      try {
        await announcementsService.editAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getAnnouncementsByRestaurantID', () => {
    const ANNOUNCEMENT_ID = 123;
    it('should successfully get active announcement by restaurant id', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number) => {
          return [
            {
              name: 'test name',
              title: 'test title',
              description: 'test description',
              hidden: false,
              submit_email: false,
              announcement_id: ANNOUNCEMENT_ID,
              restaurant_id: restaurantID,
              start_date: getStartDate(),
              end_date: getEndDate(true),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [
                {
                  image_url: 'test_url.png',
                  mediaID: 1,
                  media: {
                    media_type_id: 1,
                  },
                },
              ],
              announcement_type: {
                announcement_type_id: 1,
                type: 'modal',
              },
            },
          ] as any;
        },
      );

      const result = await announcementsService.getAnnouncementsByRestaurantID(RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          announcementID: ANNOUNCEMENT_ID,
          name: 'test name',
          title: 'test title',
          description: 'test description',
          hidden: false,
          submitEmail: false,
          active: true,
          image: {
            imageID: 1,
            imageURL: 'https://dummy_image.jpegtest_url.png',
          },
          startDate: expect.any(String),
          endDate: expect.any(String),
          type: 'modal',
        },
      ]);
    });
    it('should successfully get inactive announcement by restaurant id', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number) => {
          return [
            {
              name: 'test name',
              title: 'test title',
              description: 'test description',
              hidden: false,
              submit_email: false,
              announcement_id: ANNOUNCEMENT_ID,
              restaurant_id: restaurantID,
              start_date: getStartDate(),
              end_date: getEndDate(false),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [
                {
                  image_url: 'test_url.png',
                  mediaID: 1,
                  media: {
                    media_type_id: 1,
                  },
                },
              ],
              announcement_type: {
                announcement_type_id: 1,
                type: 'modal',
              },
            },
          ] as any;
        },
      );

      const result = await announcementsService.getAnnouncementsByRestaurantID(RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          announcementID: ANNOUNCEMENT_ID,
          name: 'test name',
          title: 'test title',
          description: 'test description',
          hidden: false,
          submitEmail: false,
          active: false,
          image: {
            imageID: 1,
            imageURL: 'https://dummy_image.jpegtest_url.png',
          },
          startDate: expect.any(String),
          endDate: expect.any(String),
          type: 'modal',
        },
      ]);
    });
    it('should successfully get announcement that has empty description and title (empty strings)', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number) => {
          return [
            {
              name: 'test name',
              title: null,
              description: null,
              hidden: false,
              submit_email: false,
              announcement_id: ANNOUNCEMENT_ID,
              restaurant_id: restaurantID,
              start_date: getStartDate(),
              end_date: getEndDate(false),
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [
                {
                  image_url: 'test_url.png',
                  mediaID: 1,
                  media: {
                    media_type_id: 1,
                  },
                },
              ],
              announcement_type: {
                announcement_type_id: 1,
                type: 'modal',
              },
            },
          ] as any;
        },
      );

      const result = await announcementsService.getAnnouncementsByRestaurantID(RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          announcementID: ANNOUNCEMENT_ID,
          name: 'test name',
          title: '',
          description: '',
          hidden: false,
          submitEmail: false,
          active: false,
          image: {
            imageID: 1,
            imageURL: 'https://dummy_image.jpegtest_url.png',
          },
          startDate: expect.any(String),
          endDate: expect.any(String),
          type: 'modal',
        },
      ]);
    });
    it('should return empty array if no announcements exist for restaurant id', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await announcementsService.getAnnouncementsByRestaurantID(RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should throw 500 HttpException if any error occurs while getting announcements by restaurant id', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementsService.getAnnouncementsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getAnnouncementByRestaurantIDOrNameOrID', () => {
    const ANNOUNCEMENT_NAME = 'test';
    const ANNOUNCEMENT_ID = 123;
    it('should successfully get announcement by id, name, and restaurant id', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name,
              hidden: false,
              announcement_id: announcementID,
              submit_email: false,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            },
          ] as AnnouncementEntity[];
        },
      );

      const result = await announcementsService.getAnnouncementByRestaurantIDOrNameOrID(RESTAURANT_ID, false, ANNOUNCEMENT_NAME, ANNOUNCEMENT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          name: ANNOUNCEMENT_NAME,
          hidden: false,
          announcement_id: ANNOUNCEMENT_ID,
          submit_email: false,
          restaurant_id: RESTAURANT_ID,
          restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
        },
      ]);
    });
    it('should throw 500 HttpException if any error occurs while fetching announcement by name, id, and restaurant id', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementsService.getAnnouncementByRestaurantIDOrNameOrID(RESTAURANT_ID, false, ANNOUNCEMENT_NAME, ANNOUNCEMENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('linkAnnouncementToMedia', () => {
    const RESTAURANT_ID = 1;
    const ANNOUNCEMENT_ID = 123;
    const linkRequest: LinkAnnouncementToMediaRequestInterface = {
      announcementID: ANNOUNCEMENT_ID,
      mediaIDs: [1, 2],
    };
    it('should successfully link announcement to media by announcementID and mediaIDs', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(false),
            restaurant: {
              restaurant_address: {
                timezone: 'America/New_York',
              },
            },
            announcement_images: [],
          },
        ];
      });
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await announcementsService.linkAnnouncementToMedia(linkRequest, RESTAURANT_ID, []);
      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while linking announcement to media by announcementID and mediaIDs', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementsService.linkAnnouncementToMedia(linkRequest, RESTAURANT_ID, []);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('uploadAnnouncementImage', () => {
    const IMAGE_NAME = 'df94-34ds-23f3-dfsr.jpeg';
    const RESTAURANT_ID = 1;
    const IMAGE_ID = 2;
    const ANNOUNCEMENT_ID = 123;
    const announcementImageEntity = {
      announcement_image_id: IMAGE_ID,
      announcement_id: ANNOUNCEMENT_ID,
      image_url: IMAGE_NAME,
    };
    it('should successfully upload announcement image', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [],
            },
          ];
        },
      );
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      // not able to assert on response since the image values are captured in a transaction
      // covered in integration tests
      await announcementsService.uploadAnnouncementImage(IMAGE_NAME, ANNOUNCEMENT_ID, [], RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementImagesService.validateImagesToDelete).not.toHaveBeenCalled();
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete image when id is provided', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [announcementImageEntity],
            },
          ];
        },
      );
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      // not able to assert on response since the image values are captured in a transaction
      // covered in integration tests
      await announcementsService.uploadAnnouncementImage(undefined, ANNOUNCEMENT_ID, [IMAGE_ID], RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementImagesService.validateImagesToDelete).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 404 Not Found HttpException if announcement doesnt exist for id provided while hiding announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => []);

      try {
        await announcementsService.uploadAnnouncementImage(IMAGE_NAME, ANNOUNCEMENT_ID, [], RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 401 Unauthorized HttpException if announcement doesnt exist for restaurant while hiding announcement', async () => {
      const DIFF_RESTAURANT_ID = 123;
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: DIFF_RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(true),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            announcement_images: [],
          },
        ];
      });

      try {
        await announcementsService.uploadAnnouncementImage(IMAGE_NAME, ANNOUNCEMENT_ID, [], RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 409 Duplicate Resource HttpException if announcement already exists for announcement and not being deleted', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [announcementImageEntity],
            },
          ];
        },
      );
      try {
        await announcementsService.uploadAnnouncementImage(IMAGE_NAME, ANNOUNCEMENT_ID, [], RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementImagesService.validateImagesToDelete).not.toHaveBeenCalled();
    });
    it('should throw 500 HttpException if any unhandled errors are thrown', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(
        (restaurantID: number, includeImage: boolean, name: string, announcementID: number) => {
          return [
            {
              name: name,
              hidden: false,
              announcement_id: announcementID,
              restaurant_id: restaurantID,
              restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
              announcement_images: [],
            },
          ];
        },
      );

      try {
        await announcementsService.uploadAnnouncementImage(IMAGE_NAME, ANNOUNCEMENT_ID, [], RESTAURANT_ID);
      } catch (err) {
        // error is thrown since transaction is not being mocked
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalled();
      expect(mockAnnouncementImagesService.validateImagesToDelete).not.toHaveBeenCalled();
    });
  });
  describe('hideAnnouncement', () => {
    const ANNOUNCEMENT_ID = 123;
    it('should successfully hide announcement with inactive status shown', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(true),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
          },
        ];
      });

      const request = { announcementID: ANNOUNCEMENT_ID, hide: true } as HideAnnouncementRequestInterface;

      const result = await announcementsService.hideAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledWith(RESTAURANT_ID, false, null, ANNOUNCEMENT_ID);
      expect(mockAnnouncementsModel.hideAnnouncement).toHaveBeenCalledWith(ANNOUNCEMENT_ID, true);
      expect(result).toEqual({ active: false });
    });
    it('should successfully show announcement with active status', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(true),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            announcement_type: {
              type: AnnouncementType.MODAL,
            },
          },
        ];
      });

      const request = { announcementID: ANNOUNCEMENT_ID, hide: false } as HideAnnouncementRequestInterface;

      const result = await announcementsService.hideAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledWith(RESTAURANT_ID, false, null, ANNOUNCEMENT_ID);
      expect(mockAnnouncementsModel.hideAnnouncement).toHaveBeenCalledWith(ANNOUNCEMENT_ID, false);
      expect(result).toEqual({ active: true });
    });
    it('should successfully show announcement with inactive status', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(false),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            announcement_type: {
              type: AnnouncementType.MODAL,
            },
          },
        ];
      });

      const request = { announcementID: ANNOUNCEMENT_ID, hide: false } as HideAnnouncementRequestInterface;

      const result = await announcementsService.hideAnnouncement(request, RESTAURANT_ID);

      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledWith(RESTAURANT_ID, false, null, ANNOUNCEMENT_ID);
      expect(mockAnnouncementsModel.hideAnnouncement).toHaveBeenCalledWith(ANNOUNCEMENT_ID, false);
      expect(result).toEqual({ active: false });
    });
    it('should throw 409 if modal announcement is shown and has overlapping time span with another modal announcement', async () => {
      const request = { announcementID: ANNOUNCEMENT_ID, hide: false } as HideAnnouncementRequestInterface;

      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: true,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(false),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            announcement_type: {
              type: AnnouncementType.MODAL,
            },
          },
          {
            name: 'Another Announcement',
            hidden: false,
            announcement_id: 99999,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(true),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
            announcement_type: {
              type: AnnouncementType.MODAL,
            },
          },
        ];
      });

      try {
        await announcementsService.hideAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 404 Not Found HttpException if announcement doesnt exist for id provided while hiding announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => []);

      const request = { announcementID: ANNOUNCEMENT_ID, hide: true } as HideAnnouncementRequestInterface;

      try {
        await announcementsService.hideAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 401 Unauthorized HttpException if announcement doesnt exist for restaurant while hiding announcement', async () => {
      const DIFF_RESTAURANT_ID = 123;
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: DIFF_RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(true),
            restaurant: { restaurant_address: { timezone: EST_TIMEZONE } },
          },
        ];
      });

      const request = { announcementID: ANNOUNCEMENT_ID, hide: true } as HideAnnouncementRequestInterface;

      try {
        await announcementsService.hideAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 404 Not Found HttpException if restaurant address doesnt exist for restaurant while hiding announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(false),
            restaurant: {},
          },
        ];
      });

      const request = { announcementID: ANNOUNCEMENT_ID, hide: true } as HideAnnouncementRequestInterface;

      try {
        await announcementsService.hideAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
    it('should throw 500 HttpException if any error occurs while hiding announcement', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      const request = { announcementID: ANNOUNCEMENT_ID, hide: true } as HideAnnouncementRequestInterface;

      try {
        await announcementsService.hideAnnouncement(request, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteAnnouncement', () => {
    const RESTAURANT_ID = 1;
    const ANNOUNCEMENT_ID = 123;
    it('should successfully soft delete announcement by announcementID and restaurantID', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        return [
          {
            hidden: false,
            announcement_id: ANNOUNCEMENT_ID,
            restaurant_id: RESTAURANT_ID,
            start_date: getStartDate(),
            end_date: getEndDate(false),
            restaurant: {
              restaurant_address: {
                timezone: 'America/New_York',
              },
            },
          },
        ];
      });

      await announcementsService.deleteAnnouncement(ANNOUNCEMENT_ID, RESTAURANT_ID);
      expect(mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID).toHaveBeenCalledTimes(1);
      expect(mockAnnouncementsModel.softDeleteAnnouncement).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while deleting announcemenuID by name and restaurantID', async () => {
      (mockAnnouncementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementsService.deleteAnnouncement(ANNOUNCEMENT_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
