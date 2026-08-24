import { DiscoveryContentCategoriesEntity } from '@/entities/discoveryContentCategories.entity';
import { DiscoveryContentUrlPlatformsEntity } from '@/entities/discoveryContentURLPlattforms.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentCategoriesModelInterface } from '@/interfaces/discoveryContentCategories.interface';
import { DiscoveryContentUrlPlatformsModelInterface } from '@/interfaces/discoveryContentUrlPlatforms.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentUrlPlatformsModel implements DiscoveryContentUrlPlatformsModelInterface {
  getAllPlatforms = async (entityManager?: EntityManager): Promise<DiscoveryContentUrlPlatformsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.find(DiscoveryContentUrlPlatformsEntity);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching all discovery url platforms. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching all discovery url platforms.  Refer to logs for more info.`),
        );
      }
    }
  };
}

export default DiscoveryContentUrlPlatformsModel;
