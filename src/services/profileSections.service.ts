import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  CreateProfileSectionRequest,
  ProfileSectionInterface,
  ProfileSectionsModelInterface,
  ProfileSectionsServiceInterface,
} from '@interfaces/profileSections.interface';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import { ProfileSectionTemplatesServiceInterface } from '@interfaces/profileSectionTemplates.interface';
import { MediaLibraryServiceInterface } from '@/interfaces/mediaLibrary.interface';
import { RestaurantProfileMediaServiceInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { CreateProfileSectionCardsDto, EditProfileSectionCardsDto } from '@/dtos/profileSections.dto';
import { ProfileCardsServiceInterface, RestaurantProfileSectionCardsInterface } from '@/interfaces/profileCards.interface';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';

class ProfileSectionsService implements ProfileSectionsServiceInterface {
  private profileSectionTemplatesService: ProfileSectionTemplatesServiceInterface;
  private profileSectionsModel: ProfileSectionsModelInterface;
  private mediaLibraryService: MediaLibraryServiceInterface;
  private restaurantProfileMediaService: RestaurantProfileMediaServiceInterface;
  private profileCardsService: ProfileCardsServiceInterface;

  constructor(
    profileSectionTemplatesService: ProfileSectionTemplatesServiceInterface,
    profileSectionsModel: ProfileSectionsModelInterface,
    mediaLibraryService: MediaLibraryServiceInterface,
    restaurantProfileMediaService: RestaurantProfileMediaServiceInterface,
    profileCardsService: ProfileCardsServiceInterface,
  ) {
    this.profileSectionsModel = profileSectionsModel;
    this.profileSectionTemplatesService = profileSectionTemplatesService;
    this.mediaLibraryService = mediaLibraryService;
    this.restaurantProfileMediaService = restaurantProfileMediaService;
    this.profileCardsService = profileCardsService;
  }

  buildProfileSectionEntities = async (
    profileSections: ProfileSectionInterface[],
    profilePageID: number,
    repository?: EntityManager,
  ): Promise<ProfileSectionEntity[]> => {
    if (!repository) {
      repository = await ormConnection();
    }

    let templateEntities: ProfileSectionTemplateEntity[] = [];
    // get section template ids for all templates provided
    const templates: string[] = profileSections.map(section => section.template).filter((template: string) => template);
    if (templates.length) {
      templateEntities = await this.profileSectionTemplatesService.getProfileSectionTemplatesByNames(templates, repository);
    }
    return profileSections.map((profileSection: ProfileSectionInterface) => {
      return new ProfileSectionEntity(
        profileSection,
        profilePageID,
        templateEntities?.find(entity => entity.template === profileSection.template.toLowerCase()),
      );
    });
  };

  createCard = async (card: CreateProfileSectionCardsDto): Promise<RestaurantProfileSectionCardsInterface> => {
    try {
      const profileCardsEntity: ProfileCardsEntity = await this.profileCardsService.upsertCard(new ProfileCardsEntity(card, card.sectionID));
      return profileCardsEntity.buildProfileSectionCardResponse();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating profile section card: ${JSON.stringify(card)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating profile section card: ${JSON.stringify(card)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  createProfileSection = async (profileSectionRequest: CreateProfileSectionRequest): Promise<ProfileSectionInterface> => {
    try {
      const sectionTemplates: ProfileSectionTemplateEntity[] = await this.profileSectionTemplatesService.getProfileSectionTemplatesByNames([
        profileSectionRequest.template?.toLowerCase(),
      ]);
      const profileSectionEntity = ProfileSectionEntity.createEntityFromCreateRequest(profileSectionRequest, sectionTemplates[0]);

      const profileSections: ProfileSectionEntity[] = await this.createProfileSections([profileSectionEntity]);
      return profileSections[0].buildProfileSectionResponse();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating profile section: ${JSON.stringify(profileSectionRequest)}. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating profile section: ${JSON.stringify(profileSectionRequest)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  createProfileSections = async (
    profileSectionEntities: Partial<ProfileSectionEntity>[],
    repository?: EntityManager,
  ): Promise<ProfileSectionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await this.profileSectionsModel.upsertProfileSections(profileSectionEntities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating profile sections: ${JSON.stringify(profileSectionEntities)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating profile sections: ${JSON.stringify(profileSectionEntities)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  deleteCard = async (cardID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.profileCardsService.deleteCard(cardID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting profile section card: ${cardID}. - ${err.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting profile section card: ${cardID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  editCard = async (card: EditProfileSectionCardsDto): Promise<void> => {
    try {
      await this.profileCardsService.upsertCard({
        restaurantProfileSectionCardID: card.cardID,
        ...(card.title && { title: card.title }),
        ...(card.content === '' ? { content: null } : card.content ? { content: card.content } : {}),
        ...(card.linkURL === '' ? { linkURL: null } : card.linkURL ? { linkURL: card.linkURL } : {}),
        ...(card.subtitle === '' ? { subtitle: null } : card.subtitle ? { subtitle: card.subtitle } : {}),
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing profile section card: ${JSON.stringify(card)}. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing profile section card: ${JSON.stringify(card)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  editProfileSection = async (profileSection: ProfileSectionInterface): Promise<void> => {
    try {
      await this.profileSectionsModel.upsertProfileSections([
        {
          restaurantProfileSectionID: profileSection.sectionID,
          ...(profileSection.name && { name: profileSection.name }),
          ...(profileSection.title === '' ? { title: null } : profileSection.title ? { title: profileSection.title } : {}),
          ...(profileSection.content === '' ? { content: null } : profileSection.content ? { content: profileSection.content } : {}),
          ...(profileSection.urlPath === '' ? { urlPath: null } : profileSection.urlPath ? { urlPath: profileSection.urlPath } : {}),
          ...(profileSection.subNav === '' ? { subNav: null } : profileSection.subNav ? { subNav: profileSection.subNav } : {}),
          ...(profileSection.isHidden != undefined && { isHidden: profileSection.isHidden }),
        },
      ]);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing profile section: ${JSON.stringify(profileSection)}. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing profile section: ${JSON.stringify(profileSection)}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  deleteProfileSection = async (sectionID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.profileSectionsModel.softDeleteProfileSection(sectionID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting profile section: ${sectionID}. - ${err.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting profile section: ${sectionID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  linkMedia = async (mediaIDs: number[], restaurantID: number, sectionID: number): Promise<void> => {
    try {
      // check if media ids dont exist for restaurant
      const currentRestaurantMediaIDs = (await this.mediaLibraryService.getMediaByRestaurantID(restaurantID))?.map(media => media.media_id);
      this.validateMedia(currentRestaurantMediaIDs, mediaIDs, restaurantID);

      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        // delete any existing media for a profile page section
        await this.restaurantProfileMediaService.softDeleteRestaurantProfileMediaBySectionID(sectionID, conn);

        // insert media for a profile page section
        if (mediaIDs?.length) {
          await this.restaurantProfileMediaService.insertRestaurantProfileMediaForPageSection(mediaIDs, sectionID, conn);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking mediaIDs ${mediaIDs} to profile section: ${sectionID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking mediaIDs ${mediaIDs} to profile section: ${sectionID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  linkMediaToProfileCard = async (mediaID: number, cardID: number): Promise<void> => {
    try {
      await this.profileCardsService.linkMediaToProfileCard(mediaID, cardID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking profile card - media. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while linking profile card - media. Refer to logs for more info.`),
        );
      }
    }
  };

  validateMedia = (currentRestaurantMediaIDs: number[], mediaIDs: number[], restaurantID: number): void => {
    for (const id of mediaIDs) {
      if (!currentRestaurantMediaIDs.includes(id)) {
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `MediaIDs of ${JSON.stringify(
              mediaIDs,
            )} have some id(s) that do not exist for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };
}

export default ProfileSectionsService;
