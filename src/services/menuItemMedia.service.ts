import { IMAGE_TYPE_ID, MediaTypesToMenuItemMediaTypesMapper } from '@constants/media.constants';
import { MediaEntity } from '@entities/media.entity';
import { MenuItemMediaEntity } from '@entities/menuItemMedia.entity';
import { MenuItemVideoThumbnailEntity } from '@entities/menuItemVideoThumbnails.entity';
import { MenuItemMediaType, MenuItemMediaTypeMapper } from '@enums/menuItemMediaTypes';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuItemMediaModelInterface, MenuItemMediaServiceInterface } from '@interfaces/menuItemMedia.interface';
import { MenuItemVideoThumbnailsServiceInterface } from '@interfaces/menuItemVideoThumbnail.interface';
import { ormConnection } from '@utils/dbUtils';
import { obtainMedia } from '@utils/imageUtils';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class MenuItemMediaService implements MenuItemMediaServiceInterface {
  private menuItemMediaModel: MenuItemMediaModelInterface;
  private menuItemVideoThumbnailService: MenuItemVideoThumbnailsServiceInterface;

  constructor(menuItemMediaModel: MenuItemMediaModelInterface, menuItemVideoThumbnailService: MenuItemVideoThumbnailsServiceInterface) {
    this.menuItemMediaModel = menuItemMediaModel;
    this.menuItemVideoThumbnailService = menuItemVideoThumbnailService;
  }

  getMenuItemMediaByMenuItemID = async (menuItemID: number, entityManager?: EntityManager): Promise<MenuItemMediaEntity[]> => {
    try {
      if (entityManager) {
        entityManager = await ormConnection();
      }
      return await this.menuItemMediaModel.getMenuItemMediaByMenuItemID(menuItemID, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Service Error occurred while getting menu item media by menu item id ${menuItemID}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Service Error occurred while getting menu item media by menu item ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  insertMenuItemMedia = async (menuItemID: number, media: MediaEntity[], entityManager?: EntityManager): Promise<MenuItemMediaEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      return await this.menuItemMediaModel.insertMenuItemMedia(
        media.map(
          _media =>
            new MenuItemMediaEntity(
              menuItemID,
              _media.media_id,
              _media.media_url,
              _media.media_type_id === IMAGE_TYPE_ID ? IMAGE_TYPE_ID : MediaTypesToMenuItemMediaTypesMapper.VIDEO,
            ),
        ),
        entityManager,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(
          `Error occurred while inserting menu item media: ${media.map(item => item.media_id)} for menuItemID: ${menuItemID}. - ${err?.stack || err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while inserting menu item media: ${media.map(
              item => item.media_id,
            )} for menuItemID: ${menuItemID}. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  linkThumbnailsToMenuItem = async (aggregateThumbnails: MenuItemVideoThumbnailEntity[], menuItemID: number, entityManager?: EntityManager) => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      // insert new thumbnails
      await this.menuItemVideoThumbnailService.insertMenuItemVideoThumbnails(aggregateThumbnails, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking thumbnail ${aggregateThumbnails} to menuItemID: ${menuItemID}. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking thumbnail ${aggregateThumbnails} to menuItemID: ${menuItemID}. Refer to logs for more detail.'`,
          ),
        );
      }
    }
  };

  softDeleteThumbnailsByIDs = async (thumbnailIDs: number[], entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      for (const thumbnail of thumbnailIDs) {
        await this.menuItemVideoThumbnailService.softDeleteMenuItemVideoThumbnail(thumbnail, entityManager);
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(`Error occurred while soft deleting thumbnails by id: ${thumbnailIDs}. - ${err?.stack - err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting thumbnails by id: ${thumbnailIDs}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  softDeleteMenuItemMediaByIDs = async (mediaIDs: number[], menuItemID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await this.menuItemMediaModel.softDeleteMenuItemMediaByIDs(mediaIDs, menuItemID, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.warn(
          `Error occurred while soft deleting menuItemID ${menuItemID} by media by mediaIDs: ${JSON.stringify(mediaIDs)}. - ${err?.stack - err}`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting menuItemID ${menuItemID} by media by mediaIDs: ${JSON.stringify(
              mediaIDs,
            )}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  uploadMenuItemMedia = async (
    images: string[],
    mediaToDelete: number[],
    menuItemID: number,
    listOrder: string[],
    thumbnail = '',
    thumbnailExistingID = 0,
    video = '',
    videoExistingID = 0,
    existingVideoURL = '',
  ): Promise<MenuItemMediaEntity[]> => {
    try {
      let menuItemMediaInsertedResult: MenuItemMediaEntity[] = [];
      const videoDeleted = mediaToDelete.includes(videoExistingID);
      const repository: EntityManager = await ormConnection();
      await repository.transaction(async conn => {
        // first, soft delete media images including video
        if (mediaToDelete?.length > 0) {
          await this.menuItemMediaModel.deleteMenuItemMedia(mediaToDelete, conn);
          // soft delete existing thumbnail too if video is being deleted
          if (videoDeleted && thumbnailExistingID) {
            await this.menuItemVideoThumbnailService.softDeleteMenuItemVideoThumbnail(thumbnailExistingID, conn);
          }
        }

        // second, insert images
        if (images?.length > 0) {
          menuItemMediaInsertedResult = await this.menuItemMediaModel.insertMenuItemMedia(
            this.buildMenuItemMediaEntities(images, menuItemID, MenuItemMediaType.IMAGE),
            conn,
          );
        }

        // third, insert video
        let videoInsertedResult: MenuItemMediaEntity[];
        let thumbnailInsertedResult: MenuItemVideoThumbnailEntity[];
        if (video) {
          // insert video
          videoInsertedResult = await this.menuItemMediaModel.insertMenuItemMedia(
            this.buildMenuItemMediaEntities([video], menuItemID, MenuItemMediaType.VIDEO),
            conn,
          );
          let existingThumbnail: MenuItemVideoThumbnailEntity;

          // 1) if thumbnail provided, soft delete existing thumbnail (if exists), and insert new thumbnail
          // 2) if thumbnail not provided, soft delete existing thumbnail (if exists), and create new exact same thumbnail as previous, but as a new db table row

          // if existing thumbnail exists, soft delete existing thumbnail
          if (thumbnailExistingID) {
            existingThumbnail = await this.menuItemVideoThumbnailService.softDeleteMenuItemVideoThumbnail(thumbnailExistingID, conn);
          }

          // get thumbnailURL from uploaded thumbnail, or from existing thumbnail if no uploaded thumbnail
          const thumbnailURL = thumbnail || existingThumbnail?.thumbnail_url;

          // if existing video is being deleted or no video currently exists
          //  - get menu_item_media_id of new uploaded video
          // else
          //  - get existing video id
          const videoID = videoDeleted || !videoExistingID ? videoInsertedResult[0].menu_item_media_id : videoExistingID;

          // set up thumbnail to insert
          const thumbnailToInsert = [{ thumbnail_url: thumbnailURL, menu_item_media_id: videoID }];

          // insert thumbnail
          thumbnailInsertedResult = await this.menuItemVideoThumbnailService.insertMenuItemVideoThumbnails(thumbnailToInsert, conn);
        } else if (thumbnail && videoExistingID) {
          // if only uploading thumbnail and video already exists but not modifying it, insert into db
          // if older thumbnail exists, first soft delete it
          if (thumbnailExistingID) {
            await this.menuItemVideoThumbnailService.softDeleteMenuItemVideoThumbnail(thumbnailExistingID, conn);
          }
          thumbnailInsertedResult = await this.menuItemVideoThumbnailService.insertMenuItemVideoThumbnails(
            [{ thumbnail_url: thumbnail, menu_item_media_id: videoExistingID }],
            conn,
          );
        }

        // 1) if video and thumbnail uploaded, then add thumbnail to response
        // 2) OR, keep same thumbnail but upload new video
        // could simplify to just "if (video) { ... }", but keeping it in for now just to explicitly state the logic
        if ((video && thumbnail) || (video && !thumbnail)) {
          videoInsertedResult[0].menu_item_video_thumbnail = {
            menu_item_video_thumbnail_id: thumbnailInsertedResult[0].menu_item_video_thumbnail_id,
            thumbnail_url: obtainMedia(thumbnailInsertedResult[0].thumbnail_url, 'image'),
          };
          menuItemMediaInsertedResult.push(...videoInsertedResult);
        } else if (!video && thumbnail) {
          // keep same video but upload new thumbnail
          // we still want to return new uploaded thumbnail response for existing video
          videoInsertedResult = [
            {
              media_url: existingVideoURL, // video already exists, do we even want to return this?  We do need to return thumbnail
              menu_item_media_id: videoExistingID,
              menu_item_video_thumbnail: {
                menu_item_video_thumbnail_id: thumbnailInsertedResult[0].menu_item_video_thumbnail_id,
                thumbnail_url: obtainMedia(thumbnailInsertedResult[0].thumbnail_url, 'image'),
              },
            },
          ];
          menuItemMediaInsertedResult.push(...videoInsertedResult);
        }

        // from returned ids of inserted images and video (if any), as well as already existing images
        // set up new list order
        let videoListOrderSet = false; // if video is included in list order, else append it to end
        if (listOrder?.length > 0) {
          const updatedListOrder = [];
          const imagesIndicesToRemove = [];
          listOrder?.forEach((mediaID, index) => {
            if (mediaID?.startsWith('filename-')) {
              // if image
              const uploadIndex = parseInt(mediaID?.split('-')[1]);
              if (images[uploadIndex]) {
                // add image list order to array
                const menuItemMediaID = menuItemMediaInsertedResult?.find(image => image.media_url === images[uploadIndex])?.menu_item_media_id;
                updatedListOrder.push({ menu_item_id: menuItemID, list_order: index, menu_item_media_id: menuItemMediaID });
                imagesIndicesToRemove.push(uploadIndex);
              } else {
                logger.error(`Error occurred with index ${uploadIndex} not existing for images array ${JSON.stringify(images)}.`);
                throw new HttpException(
                  400,
                  getErrorPayload(
                    InternalErrorCode.runtimeError,
                    `Error occurred with index ${uploadIndex} not existing for images array ${JSON.stringify(images)}. Refer to logs for more info.`,
                  ),
                );
              }
            } else if (mediaID?.startsWith('video-')) {
              // if video, add video to list order
              const menuItemMediaID = menuItemMediaInsertedResult?.find(media => media.media_url === video)?.menu_item_media_id;
              updatedListOrder.push({ menu_item_id: menuItemID, list_order: index, menu_item_media_id: menuItemMediaID });
              videoListOrderSet = true;
            } else {
              // if numerical id such as "0" or "1" or "N" (not filename-N or video-N)
              updatedListOrder.push({ menu_item_id: menuItemID, list_order: index, menu_item_media_id: parseInt(mediaID) });
            }
          });
          // we want to remove images that were already added to the list order in previous block
          imagesIndicesToRemove?.map(index => images?.splice(index, 1));

          // if there are any images left over that were not included in the mediaOrder array, we will append them to the end
          const currentListOrderCount = updatedListOrder?.length || 0;
          images?.map((imageURL, index) => {
            const imageID = menuItemMediaInsertedResult?.find(image => image.media_url === imageURL)?.menu_item_media_id;
            updatedListOrder.push({ menu_item_id: menuItemID, list_order: index + currentListOrderCount, menu_item_media_id: imageID });
          });
          // if uploaded video was not included in list order, append it to end of everything
          if (video && !videoListOrderSet) {
            const mediaID = menuItemMediaInsertedResult?.find(media => media.media_url === video)?.menu_item_media_id;
            const updatedListOrderLength = updatedListOrder?.length || 0;
            updatedListOrder.push({ menu_item_id: menuItemID, list_order: updatedListOrderLength, menu_item_media_id: mediaID });
          }
          // finally update list order
          await this.menuItemMediaModel.reorderMenuItemMediaImages(updatedListOrder, conn);
        }
        // update image_url for menu_item where list order = 0 (soon to be deprecated)
        await this.menuItemMediaModel.updateImageUrlForMenuItem(menuItemID, conn);
      });
      return menuItemMediaInsertedResult;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while uploading menu item media images to menu item.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while uploading menu item media images to menu item. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  buildMenuItemMediaEntities = (media: string[], menuItemID: number, type = MenuItemMediaType.IMAGE): MenuItemMediaEntity[] => {
    return media.map(media => {
      return {
        menu_item_id: menuItemID,
        media_url: media,
        menu_item_media_type_id: MenuItemMediaTypeMapper[type],
      };
    });
  };

  validateIDsIncluded = (idsToValidate: number[], idsToCompare: number[]): void => {
    idsToCompare.forEach(mediaID => {
      if (!idsToValidate.includes(mediaID)) {
        logger.error(`Media menuItemMediaID: ${mediaID} does not exist for menu item.`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `Media menuItemMediaID: ${mediaID} does not exist for menu item.`),
        );
      }
    });
  };
}

export default MenuItemMediaService;
