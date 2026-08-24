import {
  CreateMenuItemRequestInterface,
  CreateMenuItemResponse,
  EditMenuItemRequestInterface,
  MenuItemDBInterface,
  MenuItemModelInterface,
  MenuItemServiceInterface,
  ReorderMenuItemsQueryInterface,
  UploadMulipleMenuItemMediaResponseInterface,
} from '@interfaces/menuItem.interface';
import { ItemSizeResponse, ItemSizeServiceInterface } from '@interfaces/itemSize.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { AggregateServiceInterface } from '@interfaces/aggregate.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantEntity } from '@entities/restaurant.entity';
import { DietaryRestrictionsServiceInterface } from '@interfaces/dietaryRestrictions.interface';
import { GetMenuItemsByMenuSectionDBInterface, GetMenuItemsByMenuSectionInterface } from '@interfaces/menuItem.interface';
import { obtainImageURL, obtainMedia } from '@utils/imageUtils';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { TagsServiceInterface } from '@interfaces/tags.interface';
import { DrinkItemServiceInterface } from '@interfaces/drinkItem.interface';
import { MenuItemMediaEntity } from '@entities/menuItemMedia.entity';
import {
  LinkMenuItemAndMediaAndThumbnailsInterface,
  LinkMenuItemAndMediaInterface,
  MenuItemMediaServiceInterface,
} from '@interfaces/menuItemMedia.interface';
import { MENU_ITEM_MEDIA } from '@configs/config';
import { MenuItemVideoThumbnailEntity } from '@entities/menuItemVideoThumbnails.entity';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';
import { MediaEntity } from '@entities/media.entity';
import { IMAGE_TYPE_ID, VIDEO_TYPE_ID } from '@constants/media.constants';

const MENU_ITEM_IMAGE_TYPE = 1;
const MENU_ITEM_VIDEO_TYPE = 3;

class MenuItemService implements MenuItemServiceInterface {
  private aggregateService: AggregateServiceInterface;
  private dietaryRestrictionsService: DietaryRestrictionsServiceInterface;
  private drinkItemService: DrinkItemServiceInterface;
  private itemSizeService: ItemSizeServiceInterface;
  private menuItemModel: MenuItemModelInterface;
  private restaurantService: RestaurantsServiceInterface;
  private tagsService: TagsServiceInterface;
  private menuItemMediaService: MenuItemMediaServiceInterface;

  constructor(
    aggregateService: AggregateServiceInterface,
    dietaryRestrictionsService: DietaryRestrictionsServiceInterface,
    drinkItemService: DrinkItemServiceInterface,
    itemSizeService: ItemSizeServiceInterface,
    menuItemModel: MenuItemModelInterface,
    restaurantService: RestaurantsServiceInterface,
    tagsService: TagsServiceInterface,
    menuItemMediaService: MenuItemMediaServiceInterface,
  ) {
    this.aggregateService = aggregateService;
    this.dietaryRestrictionsService = dietaryRestrictionsService;
    this.drinkItemService = drinkItemService;
    this.itemSizeService = itemSizeService;
    this.menuItemModel = menuItemModel;
    this.restaurantService = restaurantService;
    this.tagsService = tagsService;
    this.menuItemMediaService = menuItemMediaService;
  }

  checkMenuItemMovedToNewMenuSection = async (menuItem: EditMenuItemRequestInterface): Promise<any[]> => {
    try {
      const { menuItemID, menuSectionID } = menuItem;

      // get menu items of old menu section
      // 1) for list order update
      // 2) to get old menu section id in order to check if menu item is being moved to a new menu section
      const oldMenuSectionMenuItems: MenuItemEntity[] = await this.menuItemModel.getMenuItemsOfMenuSectionByMenuItemID(menuItemID);

      // get old menu section id
      let oldMenuSectionID = -1;
      if (oldMenuSectionMenuItems?.length > 0) {
        oldMenuSectionID = oldMenuSectionMenuItems[0].menu_section_id?.['menu_section_id'];
      }

      // check if old menu section id is not the same as new menu section id
      // if so, 1) update list order of old menu section and 2) update menu item list order n+1 of new menu section
      // if not, then its just a regular edit menu item update and no changing of list order anywhere
      if (oldMenuSectionID !== menuSectionID) {
        // get largest list order value in list_order column for menu items in a menu section
        const largestMenuItemListOrderEntityOfMenuSection: number = await this.menuItemModel.getLargestListOrderInMenuSection(menuItem.menuSectionID);

        // set up list_order for new menu section of n+1 (put menu item at end of new menu section)
        menuItem['listOrder'] = largestMenuItemListOrderEntityOfMenuSection === null ? 0 : largestMenuItemListOrderEntityOfMenuSection + 1; // if empty menu section, then default to 0, else n + 1

        // get menu item ids of old menu section, filter out current menu item id of menu item being edited, update their list order via index
        const oldMenuItemsListOrder = oldMenuSectionMenuItems
          .filter(item => item.menu_item_id !== menuItemID)
          .map((item, index) => {
            return {
              menu_item_id: item.menu_item_id,
              list_order: index,
            };
          });

        return [true, oldMenuItemsListOrder];
      }
      return [false, []];
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while checking if menu item ${menuItem.menuItemID} moved to new menu section ${menuItem.menuSectionID}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while checking if menu item ${menuItem.menuItemID} moved to new menu section ${menuItem.menuSectionID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createMenuItem = async (createRequest: CreateMenuItemRequestInterface, manager?: EntityManager): Promise<CreateMenuItemResponse> => {
    let allItemSizes: ItemSizeResponse[];

    // create base item size
    const { label, price, priceOverride } = createRequest.baseItemSize;
    const baseItemSize: ItemSizeResponse = await this.itemSizeService.createItemSizeType(label, price, priceOverride, manager);

    const menuItem: MenuItemEntity = MenuItemEntity.createEntityFromCreateRequest(createRequest);
    menuItem.base_item_size_id = baseItemSize.id;
    // insert into menu item table since we need the id for everything else
    const createdMenuItem: MenuItemDBInterface = await this.menuItemModel.insertMenuItem(menuItem, manager);

    try {
      // create all item sizes
      allItemSizes = await this.itemSizeService.createAllItemSizesForMenuItem(createdMenuItem.menu_item_id, createRequest.allItemSizes, manager);
    } catch (err) {
      // Roll back menu item to not cause conflict with the naming
      await this.deleteMenuItemByID(createdMenuItem.menu_item_id, manager);
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating menu item: ${createRequest.name} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating menu item: ${createRequest.name}. Refer to logs for more info.`,
          ),
        );
      }
    }

    return this.buildCreateMenuItemResponse(createdMenuItem, baseItemSize, allItemSizes);
  };

  deleteMenuItemByID = async (menuItemID: number, manager?: EntityManager): Promise<void> => {
    await this.menuItemModel.deleteMenuItemByID(menuItemID, manager);
  };

  private getMenuSectionIdFromEntity = (menuItem: MenuItemEntity): number => {
    const section = menuItem.menu_section_id as number | { menu_section_id: number };
    return typeof section === 'object' && section !== null ? section.menu_section_id : (section as number);
  };

  private buildMenuItemPatchFields = (
    editRequest: EditMenuItemRequestInterface,
    moveCheckRequest: EditMenuItemRequestInterface,
    moveMenuSection: boolean,
  ): Partial<MenuItemEntity> => {
    const patch: Partial<MenuItemEntity> = {};

    if (editRequest.name !== undefined) {
      patch.name = editRequest.name;
    }
    if (editRequest.description !== undefined) {
      patch.description = editRequest.description;
    }
    if (editRequest.category !== undefined) {
      patch.category = editRequest.category;
    }
    if (editRequest.menuSectionID !== undefined) {
      patch.menu_section_id = editRequest.menuSectionID;
    }
    if (editRequest.listOrder !== undefined) {
      patch.list_order = editRequest.listOrder;
    } else if (moveMenuSection && moveCheckRequest.listOrder !== undefined) {
      patch.list_order = moveCheckRequest.listOrder;
    }
    if ('calories' in editRequest) {
      patch.calories = editRequest.calories;
    }
    if (editRequest.isFeatured !== undefined) {
      patch.is_featured = editRequest.isFeatured;
    }
    if (editRequest.isHidden !== undefined) {
      patch.is_hidden = editRequest.isHidden;
    }

    return patch;
  };

  editMenuItem = async (editRequest: EditMenuItemRequestInterface, manager?: EntityManager): Promise<void> => {
    try {
      const execution = async (conn: EntityManager, updateRequest: EditMenuItemRequestInterface): Promise<void> => {
        const existing = await this.menuItemModel.getMenuItemEntityByID(updateRequest.menuItemID, conn);
        const sectionIdForMoveCheck = updateRequest.menuSectionID ?? this.getMenuSectionIdFromEntity(existing);
        const moveCheckRequest: EditMenuItemRequestInterface = { ...updateRequest, menuSectionID: sectionIdForMoveCheck };

        const [moveMenuSection, oldMenuItemsListOrder = []] = await this.checkMenuItemMovedToNewMenuSection(moveCheckRequest);
        const patch = this.buildMenuItemPatchFields(updateRequest, moveCheckRequest, moveMenuSection);

        if (updateRequest.baseItemSize !== undefined && updateRequest.allItemSizes !== undefined) {
          const { label, price, priceOverride } = updateRequest.baseItemSize;
          const baseItemSize: ItemSizeResponse = await this.itemSizeService.createItemSizeType(label, price, priceOverride, conn);
          patch.base_item_size_id = baseItemSize.id;

          await this.menuItemModel.patchMenuItem(updateRequest.menuItemID, patch, conn);

          if (moveMenuSection && oldMenuItemsListOrder.length > 0) {
            await this.menuItemModel.updateMenuItemsListOrder(oldMenuItemsListOrder as ReorderMenuItemsQueryInterface[], conn);
          }

          await this.aggregateService.deleteMenuItemSizesByMenuItemID(updateRequest.menuItemID, conn);
          await this.itemSizeService.createAllItemSizesForMenuItem(updateRequest.menuItemID, updateRequest.allItemSizes, conn);
        } else {
          await this.menuItemModel.patchMenuItem(updateRequest.menuItemID, patch, conn);

          if (moveMenuSection && oldMenuItemsListOrder.length > 0) {
            await this.menuItemModel.updateMenuItemsListOrder(oldMenuItemsListOrder as ReorderMenuItemsQueryInterface[], conn);
          }
        }
      };

      if (!!manager) {
        await execution(manager, editRequest);
      } else {
        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async conn => {
          await execution(conn, editRequest);
        });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while updating menu item: ${editRequest.menuItemID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while updating menu item: ${editRequest.menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  hideMenuItem = async (menuItemID: number, hide: boolean): Promise<void> => {
    try {
      await this.menuItemModel.hideMenuItem(menuItemID, hide);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while hiding menu item ${menuItemID} -` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while hiding menu item ${menuItemID}. Refer to logs for more info.`),
        );
      }
    }
  };

  linkDrinkItemsToMenuItem = async (menuItemID: number, pairingItemIDs: number[], restaurantID: number): Promise<void> => {
    try {
      await this.drinkItemService.validatePairings(pairingItemIDs, restaurantID);

      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.aggregateService.deleteMenuItemPairingsByMenuItemID(menuItemID, conn);
        if (pairingItemIDs?.length > 0) {
          await this.aggregateService.createMenuItemPairings(menuItemID, pairingItemIDs, conn);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while pairing menu item: ${menuItemID} to drink(s): ${pairingItemIDs?.toString()}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while pairing menu item: ${menuItemID} to drink(s): ${pairingItemIDs?.toString()}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  linkMediaToMenuItem = async (media: MediaEntity[], linkRequest: LinkMenuItemAndMediaInterface, manager?: EntityManager): Promise<void> => {
    try {
      const { menuItemID, mediaIDs, thumbnails } = linkRequest;

      // need to check if number of videos passed in mediaIDs matches number of thumbnails in request
      // need to do it here rather than middleware as the middleware mediaIDs is used for other endpoints, and mediaIds will always need to be checked against thumbnails for this particular endpoint
      // so cant exclude it if thumbnails is empty array in middleware, yet should throw error in mediaIDs if more videos exist than thumbnails (only for this endpoint, and not other endpoints using middleware)
      const thumbnailLength = thumbnails?.length || 0;
      const numberOfVideos = media
        .filter(_media => mediaIDs.includes(_media.media_id))
        .filter(_media => _media.media_type_id === VIDEO_TYPE_ID).length;
      if (thumbnailLength !== numberOfVideos) {
        logger.warn(
          `Number of videos passed in request ${numberOfVideos} is not equal to number of thumbnails passed in request ${thumbnailLength}.`,
        );
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.missingInputOrIncorrectType,
            `Number of videos passed in request ${numberOfVideos} is not equal to number of thumbnails passed in request ${thumbnailLength}.`,
          ),
        );
      }

      // middleware guarantees menu item already exists
      const menuItem = await this.menuItemModel.getMenuItemEntityWithMediaByID(menuItemID);

      const mediaToUpload = media
        .filter(_media => mediaIDs.includes(_media.media_id))
        .sort((a, b) => mediaIDs.indexOf(a.media_id) - mediaIDs.indexOf(b.media_id));
      const menuItemMediaIDsToDelete: number[] = menuItem?.media?.map(_media => _media.menu_item_media_id);
      const thumbnailIDsToDelete: number[] = menuItem?.media
        ?.filter(_media => _media.media.media_type_id === VIDEO_TYPE_ID)
        .map(_media => _media?.menu_item_video_thumbnail?.menu_item_video_thumbnail_id);

      const execution = async (
        conn: EntityManager,
        mediaIDsToDelete: number[],
        itemID: number,
        tnailIDsToDelete: number[],
        uploadMedia: MediaEntity[],
      ): Promise<void> => {
        if (mediaIDsToDelete?.length > 0) {
          await this.menuItemMediaService.softDeleteMenuItemMediaByIDs(mediaIDsToDelete, itemID, conn);
        }

        if (tnailIDsToDelete?.length > 0) {
          await this.menuItemMediaService.softDeleteThumbnailsByIDs(tnailIDsToDelete, conn);
        }

        let insertedMedia: MenuItemMediaEntity[];
        if (uploadMedia?.length > 0) {
          insertedMedia = await this.menuItemMediaService.insertMenuItemMedia(itemID, uploadMedia, conn);
        }

        const videoThumbnails: MenuItemVideoThumbnailEntity[] = thumbnails.map((thumbnail: LinkMenuItemAndMediaAndThumbnailsInterface) => {
          const { menu_item_media_id } = insertedMedia.find(mediaInserted => mediaInserted?.['media_id'] === thumbnail.videoID);
          const { media_url, media_id } = media.find(_media => thumbnail.thumbnailID === _media.media_id);

          return new MenuItemVideoThumbnailEntity(menu_item_media_id, media_url, media_id);
        });

        await this.menuItemMediaService.linkThumbnailsToMenuItem(videoThumbnails, itemID, conn);
      };

      if (!!manager) {
        await execution(manager, menuItemMediaIDsToDelete, menuItemID, thumbnailIDsToDelete, mediaToUpload);
      } else {
        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async conn => {
          await execution(conn, menuItemMediaIDsToDelete, menuItemID, thumbnailIDsToDelete, mediaToUpload);
        });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking menu item - media. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while linking menu item - media. Refer to logs for more info.`),
        );
      }
    }
  };

  linkModifierGroupsToMenuItem = async (
    menuItemID: number,
    modifierGroupIDs: number[],
    restaurantID: number,
    manager?: EntityManager,
  ): Promise<void> => {
    try {
      const throwModifierGroupsException = () => {
        logger.error(`Provided modifier group does not exist for restaurant.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, 'Provided modifier group does not exist for restaurant.'));
      };

      const restaurant: RestaurantEntity = await this.restaurantService.findRestaurantEntityWithModifiersByID(restaurantID, manager);

      if (!restaurant) {
        logger.error(`Restaurant with id: ${restaurantID} does not exist.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant with id: ${restaurantID} does not exist.`));
      }

      if (modifierGroupIDs?.length > 0) {
        const modifierGroups: ModifierGroupEntity[] = restaurant.modifierGroups;

        if (!modifierGroups || modifierGroups?.length === 0) {
          throwModifierGroupsException();
        }

        const existingIDs = modifierGroups.map(group => group.modifierGroupID);

        for (const id of modifierGroupIDs) {
          if (!existingIDs.includes(id)) {
            throwModifierGroupsException();
          }
        }
      }

      const execution = async (conn: EntityManager, itemID: number, groupIDs: number[]) => {
        await this.aggregateService.deleteMenuItemModifierGroupsByMenuItemID(itemID, conn);
        if (groupIDs?.length > 0) {
          await this.aggregateService.createMenuItemModifierGroups(itemID, groupIDs, conn);
        }
      };

      if (!!manager) {
        await execution(manager, menuItemID, modifierGroupIDs);
      } else {
        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async conn => {
          await execution(conn, menuItemID, modifierGroupIDs);
        });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while linking menu item - modifier groups. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while linking menu item - modifier groups. Refer to logs for more info.`),
        );
      }
    }
  };

  linkRestrictionsToMenuItem = async (menuItemID: number, dietaryRestrictionIDs: number[]): Promise<void> => {
    try {
      // validate dietary restrictions provided exist
      await this.dietaryRestrictionsService.validateDietaryRestrictions(dietaryRestrictionIDs);
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.aggregateService.deleteMenuItemDietaryRestrictionsByMenuItemID(menuItemID, conn);
        if (dietaryRestrictionIDs?.length > 0) {
          await this.aggregateService.createMenuItemDietaryRestrictions(menuItemID, dietaryRestrictionIDs, conn);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while linking menu item - restrictions.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while linking menu item - restrictions. Refer to logs for more info.`),
        );
      }
    }
  };

  linkTagToMenuItem = async (menuItemID: number, tagIDs: number[], restaurantID: number): Promise<void> => {
    try {
      await this.tagsService.validateTagsByRestaurantID(tagIDs, restaurantID);
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.aggregateService.deleteMenuItemTagsByMenuItemID(menuItemID, conn);
        if (tagIDs?.length > 0) {
          await this.aggregateService.createMenuItemTagsByMenuItemID(menuItemID, tagIDs, conn);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating menu item - tags.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating menu item - tags. Refer to logs for more info.`),
        );
      }
    }
  };

  uploadMenuItemMedia = async (
    images: string[],
    menuItemID: number,
    mediaOrder: string[],
    mediaToDelete: number[],
    thumbnail = '',
    video = '',
  ): Promise<UploadMulipleMenuItemMediaResponseInterface> => {
    try {
      // default to 0 for easy handling of undefined
      const uploadedImagesCount = images?.length || 0;
      const uploadedVideoCount = video ? 1 : 0; // hard code to 1 for MVP

      // 1) check if mediaOrder contains uploaded images or video but no image / video being uploaded, throw 400
      // 2) check if there are more uploaded elements in mediaOrder than images / video being uploaded
      this.validateMediaOrderWithUploads(images, mediaOrder, video);

      // check if any mediaToBeDeleted are included in mediaOrder array, throw 400
      this.validateMediaToDeleteWithMediaOrder(mediaOrder, mediaToDelete);

      // get existing menu item images and video
      const menuItemMedia: MenuItemMediaEntity[] = await this.menuItemMediaService.getMenuItemMediaByMenuItemID(menuItemID);
      const existingMediaIDs = menuItemMedia?.map(media => media?.menu_item_media_id);
      const existingImageIDs = menuItemMedia
        ?.filter(media => media?.['menu_item_media_type_id']?.['type'] === 'image')
        ?.map(image => image?.menu_item_media_id);
      const existingVideoIDs = menuItemMedia
        ?.filter(media => media?.['menu_item_media_type_id']?.['type'] === 'video')
        ?.map(video => video?.menu_item_media_id);
      const existingImageIDsCount = existingImageIDs?.length || 0;
      const existingVideoIDsCount = existingVideoIDs?.length || 0;
      const imagesToDeleteCount = mediaToDelete?.filter(imageID => existingImageIDs.includes(imageID))?.length || 0;
      const videosToDeleteCount = mediaToDelete?.filter(videoID => existingVideoIDs.includes(videoID))?.length || 0;
      const existingVideoEntity = menuItemMedia?.find(media => media?.['menu_item_media_type_id']?.['type'] === 'video');

      const existingVideoURL = existingVideoEntity?.media_url;
      const thumbnailExistingID = existingVideoEntity?.menu_item_video_thumbnail?.menu_item_video_thumbnail_id;
      const existingThumbnail = !!existingVideoEntity?.menu_item_video_thumbnail;

      // check if mediaOrder is larger than max number of allowed images and video, and if so, throw a 400
      this.validateMediaOrderWithMaxAllowed(mediaOrder, existingImageIDs, existingVideoIDs);

      // check if images and videos to delete exist with current images / videos, else throw 404
      if (mediaToDelete?.length > 0) {
        this.menuItemMediaService.validateIDsIncluded(existingMediaIDs, mediaToDelete);
      }

      // (max number of allowed images) < (the current number of images in db) - (images to delete) + (images to upload)
      // if so, throw 400
      this.validateMediaTotalWithMaxAllowed(existingImageIDsCount, imagesToDeleteCount, uploadedImagesCount, 'image');

      // (max number of allowed video) < (the current number of videos in db) - (videos to delete) + (videos to upload)
      // if so, throw 400
      this.validateMediaTotalWithMaxAllowed(existingVideoIDsCount, videosToDeleteCount, uploadedVideoCount, 'video');

      // 1) check if media to reorder exist with current media, else throw 404
      // 2) check if current existing media are not included in mediaOrder (unless they are being deleted), and if so, throw a 400
      this.validateMediaOrderWithExistingMedia(existingMediaIDs, mediaOrder, mediaToDelete);

      // check if video is being uploaded but no thumbnail is being uploaded and no thumbnail currently exists in database
      this.validateVideoHasThumbnail(existingThumbnail, menuItemID, thumbnail, video);

      // 1) check if no video exists and no video is being uploaded,
      // 2) or a video is being deleted and no video is being uploaded,
      // 3) and thumbnail is being uploaded, throw 400
      const videoDeleted = mediaToDelete.includes(existingVideoIDs[0] ?? 0);
      this.validateThumbnailHasVideo(existingVideoEntity, menuItemID, thumbnail, video, videoDeleted);

      return this.buildUploadMultipleMenuItemMediaResponse(
        await this.menuItemMediaService.uploadMenuItemMedia(
          images,
          mediaToDelete,
          menuItemID,
          mediaOrder,
          thumbnail,
          thumbnailExistingID ?? 0,
          video,
          existingVideoIDs[0] ?? 0,
          existingVideoURL ?? '',
        ),
      ) as UploadMulipleMenuItemMediaResponseInterface;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while uploading multiple menu item images ${menuItemID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while uploading multiple menu item images ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  buildCreateMenuItemResponse = (
    menuItem: MenuItemDBInterface,
    baseItemSize: ItemSizeResponse,
    allItemSizes: ItemSizeResponse[],
  ): CreateMenuItemResponse => {
    return {
      menuItemID: menuItem.menu_item_id,
      menuItemUrlID: menuItem.menu_item_url_id,
      name: menuItem.name,
      description: menuItem.description,
      category: menuItem.category,
      menuSectionID: menuItem.menu_section_id,
      baseItemSize,
      allItemSizes,
      createdAt: menuItem.created_at,
      isHidden: menuItem.is_hidden || false,
      isFeatured: menuItem.is_featured ?? false,
      calories: menuItem.calories ?? null,
    };
  };

  buildUploadMenuItemVideoThumbnailResponse = (menuItemVideoThumbnails: MenuItemVideoThumbnailEntity) => {
    return {
      thumbnailID: menuItemVideoThumbnails.menu_item_video_thumbnail_id,
      thumbnailURL: menuItemVideoThumbnails.thumbnail_url,
    };
  };

  buildUploadMultipleMenuItemMediaResponse = (mediaInserted: MenuItemMediaEntity[]): UploadMulipleMenuItemMediaResponseInterface => {
    if (mediaInserted?.length) {
      return {
        media: mediaInserted.map(media => ({
          mediaURL:
            media.menu_item_media_type_id === MENU_ITEM_IMAGE_TYPE ? obtainMedia(media.media_url, 'image') : obtainMedia(media.media_url, 'video'),
          mediaID: media.menu_item_media_id,
          thumbnail: !!media.menu_item_video_thumbnail ? this.buildUploadMenuItemVideoThumbnailResponse(media.menu_item_video_thumbnail) : {},
          type: media.menu_item_media_type_id === MENU_ITEM_IMAGE_TYPE ? 'image' : 'video',
        })),
      };
    }
    return null;
  };

  softDeleteMenuItemByID = async (menuItemID: number, manager?: EntityManager): Promise<void> => {
    try {
      await this.menuItemModel.softDeleteMenuItemByID(menuItemID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting menu item: ${menuItemID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting menu item: ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getMenuItemsByMenuSection = async (
    menuSectionID: number,
    isPrixFixe = false,
    includeHidden = false,
  ): Promise<GetMenuItemsByMenuSectionInterface[]> => {
    try {
      const result: GetMenuItemsByMenuSectionDBInterface = (await this.menuItemModel.getMenuItemsByMenuSection(menuSectionID, includeHidden))[0];
      if (!result || Object.keys(result).length === 0) {
        return [] as unknown as GetMenuItemsByMenuSectionInterface[];
      }

      const menuItems = result.menuItems.sort((a, b) => (a.listOrder > b.listOrder ? 1 : -1));
      const buildResult: any = [];
      await Promise.all(
        menuItems.map(async item => {
          const temp: any = {};
          temp.name = item.name;
          temp.description = item.description || '';
          temp.menuItemID = item.menuItemID;
          temp.externalID = item.externalID;
          temp.calories = item.calories ?? null;
          temp.category = item.category || '';
          temp.createdAt = item.createdAt || '';
          temp.updatedAt = item.updatedAt || '';
          temp.isHidden = item.isHidden || false;
          temp.isFeatured = item.isFeatured ?? false;
          temp.imageURL = obtainImageURL({ imageURL: item.imageUrl }) || '';

          if (!item.dietaryRestrictions || item.dietaryRestrictions.length === 0) {
            temp.dietaryRestrictions = [];
          } else {
            temp.dietaryRestrictions = item.dietaryRestrictions.map(restriction => {
              return { restrictionID: restriction.restrictionID, name: restriction.name };
            });
          }

          if (!item.tags || item.tags.length === 0) {
            temp.tags = [];
          } else {
            temp.tags = item.tags;
          }

          if (!item.media || item?.media?.length === 0) {
            temp.media = [];
          } else {
            item?.media?.forEach(
              _media => (_media.mediaURL = _media?.type === 'image' ? obtainMedia(_media?.mediaURL) : obtainMedia(_media?.mediaURL, 'video')),
            );
            item.media = item?.media?.sort((a, b) => (a.listOrder > b.listOrder ? 1 : -1));
            item?.media.forEach(media => delete media?.listOrder);
            item?.media.forEach(_media => {
              if (_media?.type === 'image') {
                _media.thumbnail = {};
              } else {
                if (_media?.thumbnail?.['thumbnailURL']) {
                  _media.thumbnail['thumbnailURL'] = obtainMedia(_media?.thumbnail?.['thumbnailURL']);
                }
              }
            });
            temp.media = item?.media;
          }
          if (!item?.modifierGroups || item?.modifierGroups?.length === 0) {
            temp.modifierGroups = [];
          } else {
            item?.modifierGroups?.sort((a, b) => a?.listOrder - b?.listOrder);
            item?.modifierGroups?.forEach(group => group?.modifiers?.sort((a, b) => a?.listOrder - b?.listOrder));
            temp.modifierGroups =
              item?.modifierGroups?.map(group => ({
                label: group?.label,
                name: group?.name || '',
                modifierGroupID: group?.modifierGroupID,
                minimumSelections: group?.minimumSelections,
                maximumSelections: group?.maximumSelections,
                maxPerModifierSelectionQuantity: group?.maxPerModifierSelectionQuantity,
                externalID: group?.externalID,
                modifiers:
                  group?.modifiers?.map(modifier => ({
                    modifierID: modifier?.modifierID,
                    name: modifier?.name,
                    description: modifier?.description || '',
                    price: modifier?.price ?? 0,
                    isHidden: modifier?.isHidden ?? false,
                    imageURL: modifier?.media?.[0]?.mediaURL ? obtainImageURL({ imageURL: modifier?.media?.[0]?.mediaURL }) : '',
                    externalID: modifier?.externalID,
                  })) || [],
              })) || [];
          }
          temp.pairings = item?.pairings || [];

          temp.baseItemSize = this.itemSizeService.getBaseItemSizeFromAllItemSizes(item.baseItemSizeID, item.allItemSizes);
          temp.allItemSizes = item.allItemSizes;

          if (isPrixFixe) {
            temp.baseItemSize.priceOverride = 'prix';
            for (let i = 0; i < temp.allItemSizes.length; i++) {
              temp.allItemSizes[i].priceOverride = 'prix';
            }
          }

          buildResult.push(temp);
        }),
      );

      return buildResult as GetMenuItemsByMenuSectionInterface[];
    } catch (err) {
      logger.error(`Error with getting menu items by menu section ${menuSectionID}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error with getting menu items by menu section ${menuSectionID} - ${err}`),
      );
    }
  };

  getMenuItemByExternalID = async (externalID: string, manager?: EntityManager): Promise<MenuItemEntity> => {
    try {
      return await this.menuItemModel.getMenuItemByExternalID(externalID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting menu item by externalID ${externalID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting menu item by externalID ${externalID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  reorderMenuItems = async (menuSectionID: number, menuItemsOrder: number[], manager?: EntityManager): Promise<void> => {
    try {
      // get already existing menu items per menu section
      const existingMenuItems: number[] = (await this.menuItemModel.getMenuItemsEntitiesByMenuSectionID(menuSectionID, manager)).map(
        item => item.menu_item_id,
      );

      // body request menu items ids and database menu item ids must be equal length
      if (menuItemsOrder?.length !== existingMenuItems?.length) {
        logger.error(`Menu items are not same amount in body request versus database`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menu items are not same amount in body request vs database`),
        );
      }

      // make into set for O(1) time complexity for .has()
      const setMenuItemsOrder = new Set(menuItemsOrder);
      const setExistingMenuItems = new Set(existingMenuItems);

      // check for any duplicates (DTO handles this but just in case)
      if (menuItemsOrder?.length !== setMenuItemsOrder?.size || existingMenuItems?.length !== setExistingMenuItems?.size) {
        logger.error(`Menu items has duplicates in body request or database`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menu items have duplicaes in body request or database`),
        );
      }

      // O(n)?  Promise.all runs map promises async, and .has() is only O(1), should be fast
      // check if missing menu items in body request compared to database
      // logic also covers if extra menu items in body request compared to database since arrays are same length
      await Promise.all(
        existingMenuItems?.map(item => {
          if (!setMenuItemsOrder?.has(item)) {
            logger.error(`A menu item(s) in body request does not exist`);
            throw new HttpException(
              400,
              getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `A menu item(s) in body request does not exist`),
            );
          }
        }),
      );

      const buildUpdateArray = [];
      for (let index = 0; index < menuItemsOrder.length; index++) {
        buildUpdateArray.push({ menu_item_id: menuItemsOrder[index], list_order: index });
      }

      // update list order for menu sections, 1 database call via array updating multiple rows list order
      if (buildUpdateArray.length > 0) {
        if (manager) {
          await this.menuItemModel.updateMenuItemsListOrder(buildUpdateArray, manager);
        } else {
          const repository: EntityManager = await ormConnection();
          await repository.transaction(async conn => {
            await this.menuItemModel.updateMenuItemsListOrder(buildUpdateArray, conn);
          });
        }
      }
    } catch (err) {
      logger.error(`Error occurred while reordering menu items for menu section: ${menuSectionID} - ` + err);
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while reordering menu items for menu section: ${menuSectionID}`),
        );
      }
    }
  };

  // 1) check if mediaOrder contains uploaded images or video but no image / video being uploaded, throw 400
  // 2) check if there are more uploaded elements in mediaOrder than images / video being uploaded
  validateMediaOrderWithUploads(images: string[], mediaOrder: string[], video: string) {
    const imageOrderCount = mediaOrder?.filter(media => media?.startsWith('filename-'))?.length;
    const videoOrderCount = mediaOrder?.filter(media => media?.startsWith('video-'))?.length;

    if (images?.length === 0 && imageOrderCount > 0) {
      // throw exception
      logger.error(`uploaded images are in mediaOrder when no images are being uploaded in request`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.runtimeError, `uploaded images are in mediaOrder when no images are being uploaded in request`),
      );
    }

    if (!video && videoOrderCount > 0) {
      // throw exception
      logger.error(`uploaded video is in mediaOrder when no video is being uploaded in request`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.runtimeError, `uploaded video is in mediaOrder when no video is being uploaded in request`),
      );
    }

    if (imageOrderCount > images?.length) {
      // throw exception
      logger.error(`There are more uploaded images in mediaOrder than images actually being uploaded`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.runtimeError, `There are more uploaded images in mediaOrder than images actually being uploaded`),
      );
    }

    if (video && videoOrderCount > 1) {
      // throw exception
      logger.error(`There are more uploaded video in mediaOrder than video actually being uploaded`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.runtimeError, `There are more uploaded video in mediaOrder than video actually being uploaded`),
      );
    }
  }

  validateMediaToDeleteWithMediaOrder(mediaOrder: string[], mediaToDelete: number[]) {
    if (mediaToDelete?.some(mediaID => mediaOrder?.includes(mediaID.toString()))) {
      logger.error(`images / video in mediaToBeDeleted should not be included in mediaOrder array`);
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.runtimeError, `elements in mediaToBeDeleted should not be included in mediaOrder array`),
      );
    }
  }

  // check if mediaOrder is larger than max number of allowed images and video, and if so, throw a 400
  validateMediaOrderWithMaxAllowed(mediaOrder: string[], existingImageIDs: number[], existingVideoIDs: number[]) {
    const numberOfImages = mediaOrder.filter(media => media.startsWith('filename-') || existingImageIDs.includes(parseInt(media)))?.length || 0;
    const numberOfVideos = mediaOrder.filter(media => media.startsWith('video-') || existingVideoIDs.includes(parseInt(media)))?.length || 0;
    if (MENU_ITEM_MEDIA.MAX_MENU_ITEM_IMAGES_VALUE < numberOfImages) {
      logger.error(`mediaOrder number of images ${numberOfImages} should not be greater than ${MENU_ITEM_MEDIA.MAX_MENU_ITEM_IMAGES_VALUE}`);
      throw new HttpException(
        409,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `mediaOrder number of images ${numberOfImages} should not be greater than ${MENU_ITEM_MEDIA.MAX_MENU_ITEM_IMAGES_VALUE}`,
        ),
      );
    }
    if (MENU_ITEM_MEDIA.MAX_MENU_ITEM_VIDEOS_VALUE < numberOfVideos) {
      logger.error(`mediaOrder number of video ${numberOfVideos} should not be greater than ${MENU_ITEM_MEDIA.MAX_MENU_ITEM_VIDEOS_VALUE}`);
      throw new HttpException(
        409,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `mediaOrder number of video ${numberOfVideos} should not be greater than ${MENU_ITEM_MEDIA.MAX_MENU_ITEM_VIDEOS_VALUE}`,
        ),
      );
    }
  }

  validateMediaTotalWithMaxAllowed(existingMediaCount: number, mediaToDeleteCount: number, uploadedMediaCount: number, type = 'image') {
    // (max number of allowed media) < (the current number of media in db) - (media to delete) + (media to upload)
    // if so, throw 400
    const totalAllowedMedia = type === 'image' ? MENU_ITEM_MEDIA.MAX_MENU_ITEM_IMAGES_VALUE : MENU_ITEM_MEDIA.MAX_MENU_ITEM_VIDEOS_VALUE;
    if (totalAllowedMedia < existingMediaCount + uploadedMediaCount - mediaToDeleteCount) {
      logger.error(`Uploaded and existing ${type}s are more than the max limit allowed of ${totalAllowedMedia}`);
      throw new HttpException(
        409,
        getErrorPayload(InternalErrorCode.runtimeError, `Uploaded and existing ${type}s are more than the max limit allowed of ${totalAllowedMedia}`),
      );
    }
  }

  // 1) check if media to reorder exist with current media, else throw 404
  // 2) check if current existing media are not included in mediaOrder (unless they are being deleted), and if so, throw a 400
  validateMediaOrderWithExistingMedia(existingMediaIDs: number[], mediaOrder: string[], mediaToDelete: number[]) {
    if (mediaOrder?.length > 0) {
      const mediaOrderIDs = mediaOrder?.filter(item => !isNaN(parseInt(item))).map(item => parseInt(item));
      this.menuItemMediaService.validateIDsIncluded(existingMediaIDs, mediaOrderIDs);
      const missingMediaIDs = existingMediaIDs?.filter(mediaID => !mediaOrder?.includes(mediaID.toString()) && !mediaToDelete?.includes(mediaID));
      if (missingMediaIDs?.length) {
        logger.error(`current, existing mediaIDs ${missingMediaIDs} are missing in mediaOrder array ${JSON.stringify(missingMediaIDs)}`);
        throw new HttpException(
          400,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `current, existing mediaIDs ${missingMediaIDs} are missing in mediaOrder array ${JSON.stringify(mediaOrder)}`,
          ),
        );
      }
    }
  }

  // check if video is being uploaded but no thumbnail is being uploaded and no thumbnail currently exists in database
  validateVideoHasThumbnail(existingThumbnail: boolean, menuItemID: number, thumbnail: string, video: string) {
    if (video && !thumbnail && !existingThumbnail) {
      logger.error(`video is being uploaded but has no existing or uploaded thumbnail for menuItemID ${menuItemID}`);
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `video is being uploaded but has no existing or uploaded thumbnail for menuItemID ${menuItemID}`,
        ),
      );
    }
  }

  // 1) check if no video exists and no video is being uploaded,
  // 2) or a video is being deleted and no video is being uploaded,
  // 3) and thumbnail is being uploaded, throw 400
  validateThumbnailHasVideo(existingVideoEntity: MenuItemMediaEntity, menuItemID: number, thumbnail: string, video: string, videoDeleted: boolean) {
    if (!video && (!existingVideoEntity || videoDeleted) && thumbnail) {
      logger.error(`cannot upload a thumbnail that has no existing or uploaded video, or is being deleted, for menuItemID ${menuItemID}`);
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `cannot upload a thumbnail that has no existing or uploaded video, or is being deleted, for menuItemID ${menuItemID}`,
        ),
      );
    }
  }
}

export default MenuItemService;
