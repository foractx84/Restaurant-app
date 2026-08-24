import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  CreateProfilePageRequestInterface,
  CreateProfilePageResponseInterface,
  EditProfilePageRequestInterface,
  GetProfilePageDetailsResponseInterface,
  ProfilePagesModelInterface,
  ProfilePagesServiceInterface,
} from '@interfaces/profilePages.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ProfileSectionsServiceInterface, ProfileSectionWithCardMediaInterface } from '@interfaces/profileSections.interface';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { MediaResponseInterface } from '@/interfaces/mediaLibrary.interface';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';
import { MediaType } from '@/enums/mediaType';
import { ProfileSectionCardResponseInterface } from '@/interfaces/profileCards.interface';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';
import { obtainMedia } from '@/utils/imageUtils';

class ProfilePagesService implements ProfilePagesServiceInterface {
  private profilePagesModel: ProfilePagesModelInterface;
  private profileSectionsService: ProfileSectionsServiceInterface;

  constructor(profileSectionsService: ProfileSectionsServiceInterface, profilePagesModel: ProfilePagesModelInterface) {
    this.profileSectionsService = profileSectionsService;
    this.profilePagesModel = profilePagesModel;
  }

  /**
   * Create profile page and sections
   * @param createProfilePageRequest request body containing information about page being created
   * @param restaurantID id of restaurant page is being created for
   */
  createProfilePage = async (
    createProfilePageRequest: CreateProfilePageRequestInterface,
    restaurantID: number,
  ): Promise<CreateProfilePageResponseInterface> => {
    try {
      const { name, urlPath, isHidden } = createProfilePageRequest;

      // retrieving page with same name and restaurant to validate name is unique
      const existingProfilePages: ProfilePageEntity[] = await this.getProfilePageByRestaurantID(restaurantID);

      // ensure name is unique for restaurant
      if (existingProfilePages.filter(page => page.name === name).length > 0) {
        throw new HttpException(
          409,
          getErrorPayload(
            InternalErrorCode.resourceConflict,
            `A profile page with the name, ${name} already exists for your restaurant. Please choose a different name for your profile page or update existing.`,
          ),
        );
      }

      // ensure url path is unique for restaurant
      // ignoring hidden pages
      if (urlPath && !isHidden) {
        if (existingProfilePages.filter(page => page.urlPath === urlPath && !page.isHidden).length > 0) {
          throw new HttpException(
            409,
            getErrorPayload(
              InternalErrorCode.resourceConflict,
              `A profile page with the url path, ${urlPath} already exists for your restaurant. Please choose a different url path for your profile page or update existing.`,
            ),
          );
        }
      }

      let profilePageEntity: ProfilePageEntity;
      let profileSectionEntities: ProfileSectionEntity[] = [];
      const repository: EntityManager = await ormConnection();
      await repository.transaction(async (entityManager: EntityManager) => {
        // build profile page entity
        const { name, seoTitle, seoDescription, navLink, urlPath, isHidden } = createProfilePageRequest;
        profilePageEntity = await this.profilePagesModel.upsertProfilePage(
          new ProfilePageEntity(name, seoTitle, restaurantID, isHidden, seoDescription, urlPath, navLink),
          entityManager,
        );

        if (createProfilePageRequest.profileSections?.length > 0) {
          // insert profile page sections
          profileSectionEntities = await this.profileSectionsService.createProfileSections(
            await this.profileSectionsService.buildProfileSectionEntities(
              createProfilePageRequest.profileSections,
              profilePageEntity.restaurantProfilePageID,
              entityManager,
            ),
            entityManager,
          );
        }
      });

      if (profilePageEntity) {
        profilePageEntity.profileSections = profileSectionEntities;
      }

      return profilePageEntity?.buildCreateProfilePageResponse();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating profile page: ${createProfilePageRequest.name} for restaurant: ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating profile page: ${createProfilePageRequest.name} for restaurant: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  editProfilePage = async (editProfilePageRequest: EditProfilePageRequestInterface, restaurantID: number): Promise<void> => {
    try {
      const { pageID, name, seoTitle, seoDescription, navLink, urlPath, isHidden } = editProfilePageRequest;

      const existingProfilePages: ProfilePageEntity[] = await this.getProfilePageByRestaurantID(restaurantID);
      if (name || urlPath) {
        // retrieving page with same name and restaurant to validate name is unique
        const filteredPages: ProfilePageEntity[] = existingProfilePages.filter(page => page.restaurantProfilePageID !== pageID);

        // ensure name is unique for profile page
        if (filteredPages.filter(page => page.name === name && page.restaurantProfilePageID !== pageID).length > 0) {
          throw new HttpException(
            409,
            getErrorPayload(
              InternalErrorCode.resourceConflict,
              `A profile page with the name, ${name} already exists for your restaurant. Please choose a different name for your profile page or update existing.`,
            ),
          );
        }

        // ensure url path is unique for profile page
        // ignoring hidden pages
        if (urlPath && !isHidden) {
          if (existingProfilePages.filter(page => page.urlPath === urlPath && !page.isHidden && page.restaurantProfilePageID !== pageID).length > 0) {
            throw new HttpException(
              409,
              getErrorPayload(
                InternalErrorCode.resourceConflict,
                `A profile page with the url path, ${urlPath} already exists for your restaurant. Please choose a different url path for your profile page or update existing.`,
              ),
            );
          }
        }
      }

      const repository: EntityManager = await ormConnection();
      await repository.transaction(async (entityManager: EntityManager) => {
        // build profile page entity
        await this.profilePagesModel.upsertProfilePage(
          {
            restaurantProfilePageID: pageID,
            ...(name && { name }),
            ...(seoTitle === '' ? { seoTitle: null } : seoTitle ? { seoTitle } : {}),
            ...(seoDescription === '' ? { seoDescription: null } : seoDescription ? { seoDescription } : {}),
            ...(navLink === '' ? { navLink: null } : navLink ? { navLink } : {}),
            ...(urlPath === '' ? { urlPath: null } : urlPath ? { urlPath } : {}),
            ...(isHidden != undefined && { isHidden }),
          },
          entityManager,
        );
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while editing profile page: ${editProfilePageRequest.pageID} for restaurant: ${restaurantID}. - ${err?.stack || err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing profile page: ${editProfilePageRequest.pageID} for restaurant: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  getProfilePageByRestaurantID = async (restaurantID: number): Promise<ProfilePageEntity[]> => {
    try {
      return await this.profilePagesModel.fetchProfilePagesByRestaurantID(restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while retrieving profile pages by restaurant id: ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while retrieving profile pages by restaurant id: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  getProfilePageDetails = async (profilePageID: number): Promise<CreateProfilePageResponseInterface> => {
    try {
      const profilePageEntity: ProfilePageEntity = await this.profilePagesModel.fetchProfilePageByPageID(profilePageID);
      return this.buildGetProfilePageResponse(profilePageEntity);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while retrieving profile page details by id: ${profilePageID}. - ${err ? err.stack || err : 'unknown error'}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while retrieving profile page details by id: ${profilePageID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  buildGetProfilePageResponse = (profilePageEntity: ProfilePageEntity): GetProfilePageDetailsResponseInterface =>
    ({
      pageID: profilePageEntity.restaurantProfilePageID,
      name: profilePageEntity.name,
      seoTitle: profilePageEntity.seoTitle,
      seoDescription: profilePageEntity.seoDescription ?? '',
      urlPath: profilePageEntity.urlPath ?? '',
      navLink: profilePageEntity.navLink ?? '',
      isHidden: profilePageEntity.isHidden ?? false,
      profileSections: profilePageEntity.profileSections.map((section: ProfileSectionEntity) =>
        this.buildProfileSectionWithCardMediaResponse(section),
      ),
    } as GetProfilePageDetailsResponseInterface);

  buildProfileSectionWithCardMediaResponse = (sectionEntity: ProfileSectionEntity): ProfileSectionWithCardMediaInterface => {
    return {
      sectionID: sectionEntity.restaurantProfileSectionID,
      name: sectionEntity.name,
      title: sectionEntity.title ?? '',
      content: sectionEntity.content ?? '',
      template: sectionEntity.sectionTemplate?.template,
      urlPath: sectionEntity.urlPath ?? '',
      subNav: sectionEntity.subNav ?? '',
      isHidden: sectionEntity.isHidden ?? false,
      media: sectionEntity.mediaLink ? this.buildSectionMediaResponse(sectionEntity.mediaLink) : [],
      cards: sectionEntity.cards ? this.buildCardsResponse(sectionEntity.cards) : [],
    } as ProfileSectionWithCardMediaInterface;
  };

  buildSectionMediaResponse = (items: Array<RestaurantProfileMediaEntity>): MediaResponseInterface[] => {
    return items.map(
      (mediaItem: RestaurantProfileMediaEntity) =>
        ({
          mediaID: mediaItem.mediaID,
          mediaUrl: obtainMedia(mediaItem.media?.media_url, mediaItem.media?.media_type?.type),
          type: mediaItem.media?.media_type?.type ?? MediaType.IMAGE,
        } as MediaResponseInterface),
    );
  };
  buildCardsResponse = (cards: Array<ProfileCardsEntity>): ProfileSectionCardResponseInterface[] => {
    return cards.map(
      (cardItem: ProfileCardsEntity) =>
        ({
          cardID: cardItem.restaurantProfileSectionCardID,
          title: cardItem.title,
          content: cardItem.content,
          subtitle: cardItem.subtitle,
          linkURL: cardItem.linkURL,
          cardMedia: cardItem.media ? this.buildCardMediasResponse(cardItem.media) : [],
        } as ProfileSectionCardResponseInterface),
    );
  };

  buildCardMediasResponse = (cardMedias: Array<ProfileCardsMediaEntity>): MediaResponseInterface[] => {
    return cardMedias.map(
      (mediaItem: ProfileCardsMediaEntity) =>
        ({
          mediaID: mediaItem.mediaID,
          mediaUrl: obtainMedia(mediaItem.media?.media_url, mediaItem.media?.media_type?.type),
          type: mediaItem.media?.media_type?.type ?? MediaType.IMAGE,
        } as MediaResponseInterface),
    );
  };
}

export default ProfilePagesService;
