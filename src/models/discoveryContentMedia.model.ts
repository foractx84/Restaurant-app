import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentMediaModelInterface } from '@/interfaces/discoveryContentMedia.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentMediaModel implements DiscoveryContentMediaModelInterface {
  deleteDiscoveryContentMedia = async (discoveryContentID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.delete(DiscoveryContentMediaEntity, { discoveryContentID });
    } catch (err) {
      logger.error(`Error occurred while deleting media for discovery content ID: ${discoveryContentID} - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting media for discovery content ID: ${discoveryContentID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  linkDiscoveryContentMedia = async (
    discoveryContentMedia: DiscoveryContentMediaEntity[],
    entityManager?: EntityManager,
  ): Promise<DiscoveryContentMediaEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(DiscoveryContentMediaEntity, discoveryContentMedia);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking discovery content media: ${JSON.stringify(discoveryContentMedia)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content media: ${JSON.stringify(discoveryContentMedia)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentMediaModel;
