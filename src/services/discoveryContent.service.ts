import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  DiscoveryContentModelInterface,
  DiscoveryContentServiceInterface,
  GetDiscoveryResponseInterface,
} from '@interfaces/discoveryContent.interface';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import { CreateDiscoveryContentDto, EditDiscoveryContentDto } from '@/dtos/discoveryContent.dto';
import { ormConnection } from '@/utils/dbUtils';
import { EntityManager } from 'typeorm';
import { DiscoveryContentMediaServiceInterface } from '@/interfaces/discoveryContentMedia.interface';
import { DiscoveryContentMetaTagsServiceInterface } from '@/interfaces/discoveryContentMetaTags.interface';
import { DiscoveryContentCategoryBucketsServiceInterface } from '@/interfaces/discoveryContentCategoryBuckets.interface';
import { DiscoveryContentURLsServiceInterface } from '@/interfaces/discoveryContentURLs.interface';
import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';
import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';
import { PlatformENUMS, PlatformUrlTypeENUMS } from '@/enums/discoveryURLPlatforms';
import { obtainMedia, obtainUrlHTTPS } from '@/utils/imageUtils';

class DiscoveryContentService implements DiscoveryContentServiceInterface {
  private discoveryContentModel: DiscoveryContentModelInterface;
  private discoveryContentMediaService: DiscoveryContentMediaServiceInterface;
  private discoveryContentURLsService: DiscoveryContentURLsServiceInterface;
  private discoveryContentMetaTagsService: DiscoveryContentMetaTagsServiceInterface;
  private discoveryContentCategoryBucketsService: DiscoveryContentCategoryBucketsServiceInterface;

  constructor(
    discoveryContentModel: DiscoveryContentModelInterface,
    discoveryContentMediaService: DiscoveryContentMediaServiceInterface,
    discoveryContentURLsService: DiscoveryContentURLsServiceInterface,
    discoveryContentMetaTagsService: DiscoveryContentMetaTagsServiceInterface,
    discoveryContentCategoryBucketsService: DiscoveryContentCategoryBucketsServiceInterface,
  ) {
    this.discoveryContentModel = discoveryContentModel;
    this.discoveryContentMediaService = discoveryContentMediaService;
    this.discoveryContentURLsService = discoveryContentURLsService;
    this.discoveryContentMetaTagsService = discoveryContentMetaTagsService;
    this.discoveryContentCategoryBucketsService = discoveryContentCategoryBucketsService;
  }

  createDiscoveryContent = async (discoveryContent: CreateDiscoveryContentDto, restaurantID: number): Promise<GetDiscoveryResponseInterface> => {
    try {
      let discoveryContentEntity: Partial<DiscoveryContentEntity>;
      let discoveryContentResult: DiscoveryContentEntity;
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        // create discovery
        discoveryContentEntity = await this.discoveryContentModel.upsertDiscoveryContent(
          new DiscoveryContentEntity(discoveryContent.title, null, discoveryContent.description, false, restaurantID),
          conn,
        );

        // link media
        discoveryContentEntity.media = await this.discoveryContentMediaService.linkDiscoveryContentMedia(
          discoveryContent?.mediaIDs?.map(mediaID => new DiscoveryContentMediaEntity(discoveryContentEntity.discoveryContentID, mediaID)),
          conn,
        );

        // link urls
        if (discoveryContent?.urls?.length > 0) {
          discoveryContentEntity.urls = await this.discoveryContentURLsService.linkDiscoveryContentURLs(
            discoveryContentEntity.discoveryContentID,
            discoveryContent?.urls,
            conn,
          );
        }

        // link meta tags
        if (discoveryContent?.metaTags?.length > 0) {
          discoveryContentEntity.metaTags = await this.discoveryContentMetaTagsService.linkDiscoveryContentMetaTags(
            discoveryContent?.metaTags?.map(tag => new DiscoveryContentMetaTagsEntity(tag, discoveryContentEntity.discoveryContentID)),
            conn,
          );
        }

        // link categories
        if (discoveryContent?.categories?.length > 0) {
          discoveryContentEntity.categoryBuckets = await this.discoveryContentCategoryBucketsService.linkDiscoveryContentCategoryBuckets(
            discoveryContentEntity.discoveryContentID,
            discoveryContent?.categories,
            conn,
          );
        }

        // grab related tables for responses
        // note that typeorm does not return relations of parent / child tables from the direct table insert (category buckets -> categories, mediaLinks -> mediaLibrary -> media types)
        // thus, we need to "find" query on these other db tables to get this relation data to send back in the response to client
        // However, rather than performing a separate find() query for each sub item (categories, media library, media types, discovery platforms)...
        // we can reduce number of round trip queries to DB (and also reduce redundant, heavy code) by simply grabbing the entire discovery item...
        // and all its child relations via one big join query (which we use already in the middleware for HIDE and DELETE discovery endpoints)
        // this reduces a ton of extra, redundant code and unneeded db round trip queries, as well as reduce number of unit tests needed (KISS principle)
        discoveryContentResult = await this.discoveryContentModel.fetchDiscoveryContentByID(discoveryContentEntity.discoveryContentID, conn);
      });

      // can be used for both create and get discovery endpoints (passed as array to handle GET response)
      return await this.buildDiscoveryResponse([discoveryContentResult])[0];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating discovery content ${JSON.stringify(discoveryContent, null, 2)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating discovery content ${JSON.stringify(discoveryContent, null, 2)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  editDiscoveryContent = async (
    currentDiscoveryItem: DiscoveryContentEntity,
    editDiscoveryContentDto: EditDiscoveryContentDto,
    restaurantID: number,
  ): Promise<void> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        // if, either title or description is passed into the request, then update discovery item if doesnt match existing title and / or description
        // else, dont update discovery item itself
        if (
          (editDiscoveryContentDto.title && currentDiscoveryItem.title !== editDiscoveryContentDto.title) ||
          ((editDiscoveryContentDto.description || editDiscoveryContentDto.description === '') &&
            currentDiscoveryItem.description !== editDiscoveryContentDto.description)
        ) {
          await this.discoveryContentModel.upsertDiscoveryContent(
            new DiscoveryContentEntity(
              editDiscoveryContentDto.title,
              editDiscoveryContentDto.discoveryContentID,
              editDiscoveryContentDto.description,
              false,
              restaurantID,
            ),
            conn,
          );
        }

        // link media
        // 1.  If mediaIDs array of mediaLibrary not passed in request, ignore deleting / inserting media
        // 2.  If mediaIDs passed in request as non empty array:
        //        - delete all existing media from linking table (tables: discoveryItems <- mediaLinkingTable -> mediaLibrary)
        //        - and then insert new media by mediaIDs in ascending list order based on index position
        // 3.  Not possible if mediaIDs passed in request as EMPTY array, DTO validation will throw 400 and require at least one mediaID provided
        // (route middleware already checks if media and discovery item is tied to restaurant)
        if (editDiscoveryContentDto.mediaIDs) {
          await this.discoveryContentMediaService.linkDiscoveryContentMedia(
            editDiscoveryContentDto?.mediaIDs?.map(mediaID => new DiscoveryContentMediaEntity(editDiscoveryContentDto.discoveryContentID, mediaID)),
            conn,
            true, // toggle deleting existing media first, default = false
          );
        }

        // link urls
        // 1.  If urls array not passed in request, ignore deleting / inserting urls
        // 2.  If urls array passed in request as non empty array:
        //        - delete all existing urls from linking table (tables: discoveryItems <- urlsLinkingTable -> platform)
        //        - and then insert new urls
        // 3.  If urls array empty, then delete all existing urls and dont insert new ones
        if (editDiscoveryContentDto?.urls) {
          await this.discoveryContentURLsService.linkDiscoveryContentURLs(
            editDiscoveryContentDto.discoveryContentID,
            editDiscoveryContentDto?.urls,
            conn,
            true, // delete existing urls first (default = false)
          );
        }

        // link meta tags
        // 1.  If tags array not passed in request, ignore deleting / inserting tags
        // 2.  If tags array passed in request as non empty array:
        //        - delete all existing tags from metaTagss table (tables: discoveryItem <- metaTags)
        //        - and then insert new tags
        // 3.  If tags array empty, then delete all existing tags, and dont insert new ones
        if (editDiscoveryContentDto?.metaTags) {
          await this.discoveryContentMetaTagsService.linkDiscoveryContentMetaTags(
            editDiscoveryContentDto?.metaTags?.map(tag => new DiscoveryContentMetaTagsEntity(tag, editDiscoveryContentDto.discoveryContentID)),
            conn,
            editDiscoveryContentDto.discoveryContentID, // optional:  discoveryContentID value.  if passed up, deletes existing meta tags first
          );
        }

        // link categories
        // 1.  If categories array not passed in request, ignore deleting / inserting categories
        // 2.  If categories array passed in request as non empty array:
        //        - delete all existing category buckets from categoryBuckets table (tables: discoveryItem <- categoryBuckets -> categories)
        //        - and then insert new categories
        // 3.  If tags array empty, then delete all existing categories, and dont insert new ones
        if (editDiscoveryContentDto?.categories) {
          // const categoryEntities = await this.discoveryContentCategoriesService.getAllCategories();
          // const findCategoryID = (category: string): number | undefined => {
          //   return categoryEntities.find(entity => entity.name?.toLowerCase() === category?.toLowerCase())?.categoryID;
          // };

          await this.discoveryContentCategoryBucketsService.linkDiscoveryContentCategoryBuckets(
            editDiscoveryContentDto.discoveryContentID,
            editDiscoveryContentDto.categories,
            conn,
            editDiscoveryContentDto.discoveryContentID, // optional:  discoveryContentID value.  if passed up, deletes existing meta tags first
          );
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing discovery content ${editDiscoveryContentDto.discoveryContentID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing discovery content ${editDiscoveryContentDto.discoveryContentID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getDiscoveryContent = async (restaurantID: number): Promise<GetDiscoveryResponseInterface[]> => {
    try {
      const discoveryContent = await this.discoveryContentModel.getDiscoveryContentByRestaurantID(restaurantID);
      return this.buildDiscoveryResponse(discoveryContent);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching discovery content restaurantID ${restaurantID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching randomized content restaurantID ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  hideDiscoveryContent = async (discoveryContent: DiscoveryContentEntity, hide: boolean): Promise<void> => {
    try {
      discoveryContent.isHidden = hide;
      await this.discoveryContentModel.upsertDiscoveryContent(discoveryContent);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while hiding discovery content: ${discoveryContent.discoveryContentID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while hiding discovery content: ${discoveryContent.discoveryContentID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  softDeleteDiscoveryContent = async (discoveryContent: DiscoveryContentEntity): Promise<void> => {
    try {
      await this.discoveryContentModel.softDeleteDiscoveryContent(discoveryContent?.discoveryContentID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting discovery content: ${discoveryContent.discoveryContentID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting discovery content: ${discoveryContent.discoveryContentID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  // can be used for create discovery and get discovery endpoints
  buildDiscoveryResponse = (discoveryItems: DiscoveryContentEntity[]): GetDiscoveryResponseInterface[] => {
    return discoveryItems.map(discoveryContentResult => ({
      ...new DiscoveryContentEntity(
        discoveryContentResult?.title,
        discoveryContentResult?.discoveryContentID,
        discoveryContentResult?.description || '',
      )?.toResponse(),
      media:
        discoveryContentResult?.media?.map(_media => ({
          mediaID: _media?.mediaID,
          mediaUrl: obtainMedia(_media?.mediaLibrary?.media_url, _media?.mediaLibrary?.media_type?.type || 'image') || '',
          mediaType: _media?.mediaLibrary?.media_type?.type || '',
        })) || [],
      urls:
        discoveryContentResult?.urls?.map(_url => ({
          url: obtainUrlHTTPS(_url.url),
          urlID: _url.urlID,
          platform: _url?.platform?.name as PlatformENUMS,
          type: _url.urlType as PlatformUrlTypeENUMS,
        })) || [],
      metaTags:
        discoveryContentResult?.metaTags?.map(_tag => ({
          tag: _tag.tag,
          metaTagID: _tag.metaTagID,
        })) || [],
      categories:
        discoveryContentResult?.categoryBuckets?.map(bucket => ({
          categoryName: bucket?.category?.name || '',
          categoryBucketID: bucket?.bucketID,
          categoryID: bucket?.categoryID,
        })) || [],
    }));
  };
}

export default DiscoveryContentService;
