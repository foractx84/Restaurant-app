import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import {
  AnnouncementsModelInterface,
  AnnouncementsServiceInterface,
  AnnouncementStatusResponseInterface,
  CreateAnnouncementRequestInterface,
  CreateAnnouncementResponseInterface,
  EditAnnouncementRequestInterface,
  GetAnnouncementsResponseInterface,
  HideAnnouncementRequestInterface,
  LinkAnnouncementToMediaRequestInterface,
} from '@interfaces/announcements.interface';
import { AnnouncementEntity } from '@/entities/announcement.entity';
import { RestaurantAddressServiceInterface } from '@interfaces/restaurantAddress.interface';
import { getCurrentTimeForTimeZone, getTimeForTimeZone, getTimeZoneDateFromUTC, getTimeZoneFromUTC, getUTCFromTimeZone } from '@utils/timeUtils';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { AnnouncementImageResponseInterface, AnnouncementImagesServiceInterface } from '@interfaces/announcementImages.interface';
import { AnnouncementImageEntity } from '@/entities/announcementImage.entity';
import { obtainImage } from '@utils/imageUtils';
import { AnnouncementType, AnnouncementTypeNumberMapper } from '@/enums/announcementType';
import { MediaEntity } from '@entities/media.entity';

const MODAL_TYPE_ID = 1;
const EMBED_TYPE_ID = 2;
const DRAWER_TYPE_ID = 3;

class AnnouncementsService implements AnnouncementsServiceInterface {
  private announcementImagesService: AnnouncementImagesServiceInterface;
  private restaurantAddressService: RestaurantAddressServiceInterface;
  private announcementsModel: AnnouncementsModelInterface;

  constructor(
    announcementImagesService: AnnouncementImagesServiceInterface,
    restaurantAddressService: RestaurantAddressServiceInterface,
    announcementsModel: AnnouncementsModelInterface,
  ) {
    this.announcementImagesService = announcementImagesService;
    this.restaurantAddressService = restaurantAddressService;
    this.announcementsModel = announcementsModel;
  }

  createAnnouncement = async (
    announcementsRequest: CreateAnnouncementRequestInterface,
    restaurantID: number,
  ): Promise<CreateAnnouncementResponseInterface> => {
    try {
      if (announcementsRequest.type === AnnouncementType.EMBED && announcementsRequest.submitEmail) {
        logger.error('Restaurant Email Submission is not allowed on embedded announcement.');
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            'Restaurant Email Submission is not allowed on embedded announcement. Please check your input and try again.',
          ),
        );
      }

      const restaurantAnnouncements = await this.getAnnouncementByRestaurantIDOrNameOrID(restaurantID, false, announcementsRequest.name);

      // get restaurant address to use restaurant's time zone
      const restaurantAddress = await this.restaurantAddressService.getRestaurantAddressByRestaurantID(restaurantID);
      if (!restaurantAddress) {
        logger.error(`Restaurant with id: ${restaurantID} does not have an existing address.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant with id: ${restaurantID} does not have an existing address.`),
        );
      }

      this.checkAnnouncementsOverlappingTimes(announcementsRequest, restaurantAnnouncements, restaurantAddress.timezone);

      const announcement: AnnouncementEntity = await this.announcementsModel.insertAnnouncement(
        this.buildAnnouncementEntity(announcementsRequest, restaurantID, restaurantAddress.timezone, false), // kept hidden in for now until we decide what to do upon creation
      );
      return this.buildCreateAnnouncementResponse(announcement, announcementsRequest.type, restaurantAddress.timezone);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while creating announcement ${JSON.stringify(announcementsRequest)} for restaurantID: ${restaurantID}. - ` + err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating announcement ${JSON.stringify(
              announcementsRequest,
            )} for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  deleteAnnouncement = async (announcementID: number, restaurantID: number): Promise<void> => {
    try {
      await this.getAnnouncementByRestaurantIDOrNameOrID(restaurantID, false, null, announcementID);

      await this.announcementsModel.softDeleteAnnouncement(announcementID, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting announcementID ${announcementID} for restaurantID: ${restaurantID}. - ` + err);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError));
      }
    }
  };

  editAnnouncement = async (
    announcementsRequest: EditAnnouncementRequestInterface,
    restaurantID: number,
  ): Promise<AnnouncementStatusResponseInterface> => {
    try {
      const announcements = await this.getAnnouncementByRestaurantIDOrNameOrID(
        restaurantID,
        true,
        announcementsRequest.name,
        announcementsRequest.announcementID,
      );
      const announcement = announcements.find(item => item.announcement_id === announcementsRequest.announcementID);

      const { type, submitEmail } = announcementsRequest;

      if (type) {
        if (
          (announcement.announcement_type.type === AnnouncementType.MODAL || announcement.announcement_type.type === AnnouncementType.DRAWER) &&
          type === AnnouncementType.EMBED &&
          announcement.announcement_images.length === 0
        ) {
          logger.error(
            `Cannot switch announcement type from ${announcement.announcement_type.type} to ${type} for announcementID: ${announcementsRequest.announcementID} without an image.`,
          );
          throw new HttpException(
            400,
            getErrorPayload(
              InternalErrorCode.missingInputOrIncorrectType,
              `Cannot switch announcement type from ${announcement.announcement_type.type} to ${type} for announcementID: ${announcementsRequest.announcementID} without an image. Please check your input and try again.`,
            ),
          );
        }
        if (
          typeof submitEmail === 'boolean' &&
          type === AnnouncementType.EMBED &&
          (announcement.announcement_type.type === AnnouncementType.MODAL || announcement.announcement_type.type === AnnouncementType.DRAWER)
        ) {
          announcementsRequest['submitEmail'] = announcement.submit_email || false;
        }
      }
      const { timezone } = announcement.restaurant.restaurant_address;
      announcementsRequest['hidden'] = announcement.hidden;
      announcementsRequest.type = type ? type : AnnouncementTypeNumberMapper[announcement.announcement_type_id];
      const announcementToRemove = announcements.findIndex(
        currentAnnouncement => currentAnnouncement.announcement_id === announcement.announcement_id,
      );
      if (announcementToRemove > -1) {
        announcements.splice(announcementToRemove, 1);
      }

      this.checkAnnouncementsOverlappingTimes(announcementsRequest, announcements, timezone);

      const builtAnnouncement = this.buildAnnouncementEntity(announcementsRequest, restaurantID, timezone);
      await this.announcementsModel.updateAnnouncement({ ...announcement, ...builtAnnouncement });

      return {
        active: this.isAnnouncementActiveCheck(
          getTimeZoneFromUTC(builtAnnouncement.start_date, timezone),
          getTimeZoneFromUTC(builtAnnouncement.end_date, timezone),
          announcement.hidden,
          timezone,
        ),
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing announcement ${JSON.stringify(announcementsRequest)} for restaurantID: ${restaurantID}. - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing announcement ${JSON.stringify(
              announcementsRequest,
            )} for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  getAnnouncementsByRestaurantID = async (restaurantID: number): Promise<GetAnnouncementsResponseInterface[]> => {
    try {
      const announcements = await this.getAnnouncementByRestaurantIDOrNameOrID(restaurantID, true);

      if (announcements?.length > 0) {
        return announcements.map(announcement => {
          const { timezone } = announcement.restaurant.restaurant_address;
          const startDate = getTimeZoneFromUTC(announcement.start_date, timezone);
          const endDate = getTimeZoneFromUTC(announcement.end_date, timezone);
          const image =
            announcement?.announcement_images?.length && announcement?.announcement_images?.[0]?.media
              ? {
                  imageID: announcement.announcement_images[0].mediaID,
                  imageURL: obtainImage(announcement.announcement_images[0].image_url),
                }
              : {};
          return {
            announcementID: announcement.announcement_id,
            name: announcement.name,
            title: announcement.title || '',
            description: announcement.description || '',
            image,
            startDate: startDate,
            endDate: endDate,
            hidden: announcement.hidden,
            submitEmail: announcement.submit_email,
            active: this.isAnnouncementActiveCheck(startDate, endDate, announcement.hidden, timezone),
            type: announcement.announcement_type.type,
          } as GetAnnouncementsResponseInterface;
        });
      }

      return [];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting announcements by restaurantID: ${restaurantID}. - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting announcements by restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  hideAnnouncement = async (
    announcementRequest: HideAnnouncementRequestInterface,
    restaurantID: number,
  ): Promise<AnnouncementStatusResponseInterface> => {
    try {
      const announcements = await this.getAnnouncementByRestaurantIDOrNameOrID(restaurantID, false, null, announcementRequest.announcementID);
      const announcement = announcements.find(item => item.announcement_id === announcementRequest.announcementID);
      const { timezone } = announcement.restaurant.restaurant_address;

      // only check overlapping times if announcement is being shown
      if (!announcementRequest.hide) {
        const announcementToRemove = announcements.findIndex(
          currentAnnouncement => currentAnnouncement.announcement_id === announcement.announcement_id,
        );

        if (announcementToRemove > -1) {
          announcements.splice(announcementToRemove, 1);
        }

        if (announcements.length) {
          announcement['type'] = announcement.announcement_type.type;
          announcement['hidden'] = announcementRequest.hide;
          announcement['startDate'] = announcement.start_date;
          announcement['endDate'] = announcement.end_date;

          this.checkAnnouncementsOverlappingTimes(announcement as unknown as CreateAnnouncementRequestInterface, announcements, timezone);
        }
      }

      await this.announcementsModel.hideAnnouncement(announcementRequest.announcementID, announcementRequest.hide);

      return {
        active: this.isAnnouncementActiveCheck(
          getTimeZoneFromUTC(announcement.start_date, timezone),
          getTimeZoneFromUTC(announcement.end_date, timezone),
          announcementRequest.hide,
          timezone,
        ),
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while setting hidden to ${announcementRequest.hide} for announcement: ${announcementRequest.announcementID}, for restaurantID: ${restaurantID}. - ` +
            err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting hidden to ${announcementRequest.hide} for announcement: ${announcementRequest.announcementID}, for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  linkAnnouncementToMedia = async (
    linkRequest: LinkAnnouncementToMediaRequestInterface,
    restaurantID: number,
    media: MediaEntity[],
  ): Promise<void> => {
    try {
      const { announcementID, mediaIDs } = linkRequest;
      const announcements = await this.getAnnouncementByRestaurantIDOrNameOrID(restaurantID, true, null, announcementID);

      const mediaToUpload = media.filter(_media => mediaIDs.includes(_media.media_id));
      const imageIDs: number[] = announcements
        .find(announcement => announcement.announcement_id === announcementID)
        .announcement_images?.map(image => image.announcement_image_id);

      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        if (imageIDs?.length > 0) {
          await this.announcementImagesService.deleteImages(imageIDs, announcementID, conn);
        }

        if (mediaToUpload?.length > 0) {
          await this.announcementImagesService.insertAnnouncementMedia(announcementID, mediaToUpload);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while linking announcement: ${linkRequest.announcementID} to media: ${linkRequest.mediaIDs}. - ${err?.stack || err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking announcement: ${linkRequest.announcementID} to media: ${linkRequest.mediaIDs}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  uploadAnnouncementImage = async (
    image: string,
    announcementID: number,
    imagesToDelete: number[],
    restaurantID: number,
  ): Promise<AnnouncementImageResponseInterface> => {
    try {
      const announcements = await this.getAnnouncementByRestaurantIDOrNameOrID(restaurantID, true, null, announcementID);

      const announcementImages: AnnouncementImageEntity[] = announcements.find(
        announcement => announcement.announcement_id === announcementID,
      ).announcement_images;

      const existingImageIDs = announcementImages.map(announcementImage => announcementImage.announcement_image_id);
      if (imagesToDelete?.length > 0) {
        this.announcementImagesService.validateImagesToDelete(existingImageIDs, imagesToDelete);
      }

      if (image) {
        const leftOverIDs = existingImageIDs.filter(id => !imagesToDelete.includes(id));
        if (leftOverIDs.length > 0) {
          logger.error(`Image already exists for announcement: ${announcementID}. Must delete existing to upload a new image.`);
          throw new HttpException(
            409,
            getErrorPayload(
              InternalErrorCode.resourceConflict,
              `Image already exists for announcement: ${announcementID}. Must delete existing to upload a new image.`,
            ),
          );
        }
      }

      let insertedImage: AnnouncementImageEntity;
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        if (imagesToDelete?.length > 0) {
          await this.announcementImagesService.deleteImages(imagesToDelete, announcementID, conn);
        }

        if (image) {
          insertedImage = await this.announcementImagesService.insertAnnouncementImage(
            {
              announcement_id: announcementID,
              image_url: image,
            },
            conn,
          );
        }
      });

      if (insertedImage) {
        return {
          imageID: insertedImage.announcement_image_id,
          imageURL: obtainImage(insertedImage.image_url),
        } as unknown as AnnouncementImageResponseInterface;
      }

      return null;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while uploading announcement image for announcement: ${announcementID} and restaurant: ${restaurantID}. - ` + err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while uploading announcement image for announcement: ${announcementID} and restaurant: ${restaurantID}. Refer to logs for more info`,
          ),
        );
      }
    }
  };

  getAnnouncementByRestaurantIDOrNameOrID = async (
    restaurantID: number,
    includeImage: boolean,
    name?: string,
    announcementID?: number,
  ): Promise<AnnouncementEntity[]> => {
    try {
      const announcements = await this.announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(
        restaurantID,
        includeImage,
        name,
        announcementID,
      );

      if (announcementID) {
        const announcement = announcements.find(item => item.announcement_id === announcementID);
        if (!announcement) {
          logger.error(`Announcement with id: ${announcementID} does not exist.`);
          throw new HttpException(
            404,
            getErrorPayload(InternalErrorCode.inputValueNotInDB, `Announcement with id: ${announcementID} does not exist.`),
          );
        }

        if (announcement.restaurant_id !== restaurantID) {
          logger.error(`Announcement with id: ${announcementID} does not exist for restaurant: ${restaurantID}.`);
          throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
        }

        if (!announcement.restaurant?.restaurant_address) {
          logger.error(`Restaurant with id: ${restaurantID} does not have an existing address.`);
          throw new HttpException(
            404,
            getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant with id: ${restaurantID} does not have an existing address.`),
          );
        }
      }

      if (name) {
        const existingAnnouncement = announcements.find(item => item.name === name);
        if (existingAnnouncement && Object.keys(existingAnnouncement).length > 0 && existingAnnouncement.announcement_id !== announcementID) {
          logger.error(`Announcement with name: ${name} already exists for restaurant ${restaurantID}.`);
          throw new HttpException(
            409,
            getErrorPayload(InternalErrorCode.resourceConflict, `Announcement with name: ${name} already exists for restaurant ${restaurantID}.`),
          );
        }
      }

      return announcements;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while fetching announcement with id: ${announcementID} and name: ${name} for restaurantID: ${restaurantID}. - ` + err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching announcement with id: ${announcementID} and name: ${name} for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  buildAnnouncementEntity = (
    announcementRequest: CreateAnnouncementRequestInterface | EditAnnouncementRequestInterface,
    restaurantID: number,
    timezone: string,
    hidden = false,
  ): AnnouncementEntity => {
    const announcementEntity = {
      name: announcementRequest.name,
      title: announcementRequest.title,
      description: announcementRequest.description,
      start_date: getUTCFromTimeZone(announcementRequest.startDate, timezone),
      end_date: getUTCFromTimeZone(announcementRequest.endDate, timezone),
      restaurant_id: restaurantID,
      hidden,
      type: announcementRequest.type,
      submit_email: announcementRequest.submitEmail,
    } as AnnouncementEntity;

    const AnnouncementTypeMapper = {
      modal: MODAL_TYPE_ID,
      embed: EMBED_TYPE_ID,
      drawer: DRAWER_TYPE_ID,
    };
    if (announcementRequest.type) {
      announcementEntity.announcement_type_id = AnnouncementTypeMapper[announcementRequest.type];
    }
    return announcementEntity;
  };

  buildCreateAnnouncementResponse = (
    announcement: AnnouncementEntity,
    announcementType: AnnouncementType,
    timezone: string,
  ): CreateAnnouncementResponseInterface => {
    const startDate = getTimeZoneFromUTC(announcement.start_date, timezone);
    const endDate = getTimeZoneFromUTC(announcement.end_date, timezone);
    return {
      announcementID: announcement.announcement_id,
      name: announcement.name,
      title: announcement.title || '',
      description: announcement.description || '',
      startDate: startDate,
      endDate: endDate,
      hidden: announcement.hidden,
      active: this.isAnnouncementActiveCheck(startDate, endDate, announcement.hidden, timezone),
      type: announcementType,
      submitEmail: announcement.submit_email,
    } as CreateAnnouncementResponseInterface;
  };

  isAnnouncementActiveCheck = (startDate: string, endDate: string, hidden: boolean, timezone: string): boolean => {
    return (
      getTimeForTimeZone(startDate, 'en-us', timezone) < getCurrentTimeForTimeZone('en-us', timezone) &&
      getTimeForTimeZone(endDate, 'en-us', timezone) > getCurrentTimeForTimeZone('en-us', timezone) &&
      !hidden
    );
  };

  /**
   * Checks if start time and end time of an announcement overlap with an already existing announcement of same type
   * examples:
   * startDate <= announcementRequestStartDate <=endDate -> return true
   * startDate <= announcementRequestEndDate <= endDate -> return true
   * announcementRequestStartDate <= startDate && announcementRequestEndDate >= endDate -> return true
   * else return false
   * @param announcementRequestStartDate '2017-05-15T09:10:23.000Z'
   * @param announcementRequestEndDate '2018-05-15T09:10:23.000Z'
   * @param startDate '2017-04-15T09:10:23.000Z'
   * @param endDate '2017-06-15T09:10:23.000Z'
   * @return {@type boolean} if overlapping time, then return true, else false
   */
  validateOverlappingTimeSpans = (announcementRequestStartDate: Date, announcementRequestEndDate: Date, startDate: Date, endDate: Date) => {
    return (
      (announcementRequestStartDate >= startDate && announcementRequestStartDate <= endDate) ||
      (announcementRequestEndDate >= startDate && announcementRequestEndDate <= endDate) ||
      (announcementRequestStartDate <= startDate && announcementRequestEndDate >= endDate)
    );
  };

  checkAnnouncementsOverlappingTimes = (
    announcementsRequest: CreateAnnouncementRequestInterface | EditAnnouncementRequestInterface,
    restaurantAnnouncements: AnnouncementEntity[],
    timezone: string,
  ) => {
    // need to check if any announcements (active or inactive) that are not hidden have overlapping time spans,
    // and if so, throw 409 error (MVP)
    if (!announcementsRequest?.['hidden']) {
      restaurantAnnouncements.some(announcement => {
        if (
          (announcement.announcement_type.type === announcementsRequest.type ||
            (announcement.announcement_type.type === 'modal' && announcementsRequest.type === 'drawer') ||
            (announcement.announcement_type.type === 'drawer' && announcementsRequest.type === 'modal')) &&
          !announcement.hidden
        ) {
          const startDate = getTimeZoneDateFromUTC(announcement.start_date, timezone);
          const endDate = getTimeZoneDateFromUTC(announcement.end_date, timezone);
          if (
            this.validateOverlappingTimeSpans(
              getTimeZoneDateFromUTC(new Date(announcementsRequest.startDate), timezone),
              getTimeZoneDateFromUTC(new Date(announcementsRequest.endDate), timezone),
              startDate,
              endDate,
            )
          ) {
            // overlapping times exist, throw 409 error
            logger.error(
              `Announcement name "${announcementsRequest?.name}" being created of type "${announcementsRequest?.type}" has an overlapping time span with another announcement "${announcement?.name}" of type "${announcement?.announcement_type?.type}".`,
            );
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.inputValueNotInDB,
                `There is already a ${
                  announcementsRequest.type === 'modal' || announcementsRequest.type === 'drawer' ? 'modal or drawer' : announcementsRequest.type
                } announcement, ${announcement.name}, that exists with an overlapping timespan ${startDate?.toLocaleDateString(
                  'en-US',
                )} ${startDate?.toLocaleTimeString('en-US', { timeStyle: 'short' })} - ${endDate?.toLocaleDateString(
                  'en-US',
                )} ${endDate?.toLocaleTimeString('en-US', { timeStyle: 'short' })}.`,
              ),
            );
          }
        }
      });
    }
  };
}

export default AnnouncementsService;
