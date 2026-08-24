import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { DiscoveryContentModelInterface } from '@interfaces/discoveryContent.interface';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import { getCurrentDate } from '@utils/timeUtils';

class DiscoveryContentModel implements DiscoveryContentModelInterface {
  fetchDiscoveryContentByID = async (discoveryContentID: number, entityManager?: EntityManager): Promise<DiscoveryContentEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      // need to change to createQueryBuilder in order to filter on deletedAt != null for media library,
      // as relations: [...] check with findOne() does not have that option
      // also, by making this middleware query join on all discovery child tables...
      // we can do this entire check just once in the middleware and pass onto controller and service file..
      // for all  future endpoints to be made...
      // and not need to redundantly query on all sub tables later on in service file logic to get sub tables
      return await entityManager
        .getRepository(DiscoveryContentEntity)
        .createQueryBuilder('content')
        .leftJoinAndSelect('content.media', 'media')
        .leftJoinAndSelect('media.mediaLibrary', 'mediaLibrary', 'mediaLibrary.deleted_at IS NULL')
        .leftJoinAndSelect('mediaLibrary.media_type', 'media_type')
        .leftJoinAndSelect('content.urls', 'urls')
        .leftJoinAndSelect('urls.platform', 'platform')
        .leftJoinAndSelect('content.metaTags', 'tags')
        .leftJoinAndSelect('content.categoryBuckets', 'categoryBuckets')
        .leftJoinAndSelect('categoryBuckets.category', 'category')
        .where('content.discoveryContentID = :discoveryContentID', { discoveryContentID })
        .andWhere('content.deletedAt IS NULL')
        .orderBy('media.listOrder', 'ASC')
        .getOne();
    } catch (err) {
      logger.error(`Error occurred while fetching discovery content by id: ${discoveryContentID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching discovery content by id: ${discoveryContentID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getDiscoveryContentByRestaurantID = async (restaurantID: number): Promise<DiscoveryContentEntity[]> => {
    try {
      const entityManager = await ormConnection();
      return await entityManager
        .getRepository(DiscoveryContentEntity)
        .createQueryBuilder('content')
        .leftJoinAndSelect('content.restaurant', 'restaurant')
        .leftJoinAndSelect('content.media', 'media')
        .leftJoinAndSelect('media.mediaLibrary', 'mediaLibrary', 'mediaLibrary.deleted_at IS NULL')
        .leftJoinAndSelect('mediaLibrary.media_type', 'media_type')
        .leftJoinAndSelect('content.urls', 'urls')
        .leftJoinAndSelect('urls.platform', 'platform')
        .leftJoinAndSelect('content.metaTags', 'tags')
        .leftJoinAndSelect('content.categoryBuckets', 'categoryBuckets')
        .leftJoinAndSelect('categoryBuckets.category', 'category')
        .where('content.restaurantID = :restaurantID', { restaurantID: restaurantID })
        .andWhere('content.deletedAt IS NULL')
        .andWhere('restaurant.deleted = :deleted', { deleted: false })
        .orderBy({
          'content.createdAt': 'ASC',
          'media.listOrder': 'ASC',
        })
        .getMany();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching discovery content for restaurantID: ${restaurantID}.`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching discovery content for restaurantID: ${restaurantID}.`),
        );
      }
    }
  };

  softDeleteDiscoveryContent = async (discoveryContentID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.update(DiscoveryContentEntity, { discoveryContentID }, { deletedAt: getCurrentDate() });
    } catch (err) {
      logger.error(`Error while soft deleting discovery content: '${discoveryContentID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while soft deleting discovery content: '${discoveryContentID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  upsertDiscoveryContent = async (discoveryContent: DiscoveryContentEntity, entityManager?: EntityManager): Promise<DiscoveryContentEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(DiscoveryContentEntity, discoveryContent);
    } catch (err) {
      logger.error(`Error occurred while upserting discoveryContent: ${JSON.stringify(discoveryContent)} - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while upserting discoveryContent: ${discoveryContent}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default DiscoveryContentModel;
