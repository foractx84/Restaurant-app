import { DiscoveryContentCategoryBucketsEntity } from '@/entities/discoveryContentBuckets.entity';
import { PlatformENUMS } from '@/enums/discoveryURLPlatforms';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentCategoriesServiceInterface } from '@/interfaces/discoveryContentCategories.interface';
import {
  DiscoveryContentCategoryBucketsModelInterface,
  DiscoveryContentCategoryBucketsServiceInterface,
} from '@/interfaces/discoveryContentCategoryBuckets.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentCategoryBucketsService implements DiscoveryContentCategoryBucketsServiceInterface {
  private discoveryContentCategoryBucketsModel: DiscoveryContentCategoryBucketsModelInterface;
  private discoveryContentCategoriesService: DiscoveryContentCategoriesServiceInterface;

  constructor(
    discoveryContentCategoryBucketsModel: DiscoveryContentCategoryBucketsModelInterface,
    discoveryContentCategoriesService: DiscoveryContentCategoriesServiceInterface,
  ) {
    this.discoveryContentCategoryBucketsModel = discoveryContentCategoryBucketsModel;
    this.discoveryContentCategoriesService = discoveryContentCategoriesService;
  }

  linkDiscoveryContentCategoryBuckets = async (
    discoveryContentID: number,
    discoveryContenCategoryBuckets: string[],
    entityManager?: EntityManager,
    optionalDiscoveryContentIDToDelete?: number,
  ): Promise<DiscoveryContentCategoryBucketsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      // If meet condition, then DELETE any existing category buckets
      if (optionalDiscoveryContentIDToDelete && optionalDiscoveryContentIDToDelete > 0) {
        await this.discoveryContentCategoryBucketsModel.deleteDiscoveryContentCategoryBuckets(discoveryContentID, entityManager);
      }

      // if discoveryContenCategoryBuckets array is empty, then return empty array and dont insert anything
      if (discoveryContenCategoryBuckets.length === 0) {
        return [];
      }

      // else fetch platforms and then insert and return result
      const categoryEntities = await this.discoveryContentCategoriesService.getAllCategories();
      const findCategoryID = (category: string): number | undefined => {
        return categoryEntities.find(entity => entity.name?.toLowerCase() === category?.toLowerCase())?.categoryID;
      };

      // insert and return result
      return await this.discoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets(
        discoveryContenCategoryBuckets?.map(bucket => new DiscoveryContentCategoryBucketsEntity(discoveryContentID, findCategoryID(bucket))),
        entityManager,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while linking discovery content category buckets: ${JSON.stringify(discoveryContenCategoryBuckets)}. - ${
            err?.stack ?? err
          }`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content category buckets: ${JSON.stringify(
              discoveryContenCategoryBuckets,
            )}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentCategoryBucketsService;
