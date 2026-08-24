import { DiscoveryContentCategoryBucketsEntity } from '@/entities/discoveryContentBuckets.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentCategoryBucketsModelInterface } from '@/interfaces/discoveryContentCategoryBuckets.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentCategoryBucketsModel implements DiscoveryContentCategoryBucketsModelInterface {
  deleteDiscoveryContentCategoryBuckets = async (discoveryContentID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.delete(DiscoveryContentCategoryBucketsEntity, { contentID: discoveryContentID });
    } catch (err) {
      logger.error(`Error occurred while deleting category buckets for discovery content ID: ${discoveryContentID} - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting category buckets for discovery content ID: ${discoveryContentID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  linkDiscoveryContentCategoryBuckets = async (
    discoveryContentCategoryBuckets: DiscoveryContentCategoryBucketsEntity[],
    entityManager?: EntityManager,
  ): Promise<DiscoveryContentCategoryBucketsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(discoveryContentCategoryBuckets);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while linking discovery content category buckets: ${JSON.stringify(discoveryContentCategoryBuckets)}. - ${
            err?.stack ?? err
          }`,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content category buckets: ${JSON.stringify(
              discoveryContentCategoryBuckets,
            )}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentCategoryBucketsModel;
