import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentURLsModelInterface } from '@/interfaces/discoveryContentURLs.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentURLsModel implements DiscoveryContentURLsModelInterface {
  deleteDiscoveryContentURLs = async (discoveryContentID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.delete(DiscoveryContentURLsEntity, { contentID: discoveryContentID });
    } catch (err) {
      logger.error(`Error occurred while deleting URLs for discovery content ID: ${discoveryContentID} - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting URLs for discovery content ID: ${discoveryContentID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  linkDiscoveryContentURLs = async (
    discoveryContentURLs: DiscoveryContentURLsEntity[],
    entityManager?: EntityManager,
  ): Promise<DiscoveryContentURLsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(DiscoveryContentURLsEntity, discoveryContentURLs);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking discovery content URLs: ${JSON.stringify(discoveryContentURLs)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content URLs: ${JSON.stringify(discoveryContentURLs)}.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentURLsModel;
