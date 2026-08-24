import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentMetaTagsModelInterface } from '@/interfaces/discoveryContentMetaTags.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentMetaTagsModel implements DiscoveryContentMetaTagsModelInterface {
  deleteDiscoveryContentMetaTags = async (discoveryContentID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.delete(DiscoveryContentMetaTagsEntity, { contentID: discoveryContentID });
    } catch (err) {
      logger.error(`Error occurred while deleting meta tags for discovery content ID: ${discoveryContentID} - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting meta tags for discovery content ID: ${discoveryContentID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  linkDiscoveryContentMetaTags = async (
    discoveryContentMetaTags: DiscoveryContentMetaTagsEntity[],
    entityManager?: EntityManager,
  ): Promise<DiscoveryContentMetaTagsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(DiscoveryContentMetaTagsEntity, discoveryContentMetaTags);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking discovery content meta tags: ${JSON.stringify(discoveryContentMetaTags)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content meta tags: ${JSON.stringify(discoveryContentMetaTags)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentMetaTagsModel;
