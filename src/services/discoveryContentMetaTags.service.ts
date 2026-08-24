import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentMetaTagsModelInterface, DiscoveryContentMetaTagsServiceInterface } from '@/interfaces/discoveryContentMetaTags.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentMetaTagsService implements DiscoveryContentMetaTagsServiceInterface {
  private discoveryContentMetaTagsModel: DiscoveryContentMetaTagsModelInterface;

  constructor(discoveryContentMetaTagsModel: DiscoveryContentMetaTagsModelInterface) {
    this.discoveryContentMetaTagsModel = discoveryContentMetaTagsModel;
  }

  linkDiscoveryContentMetaTags = async (
    discoveryContenMetaTags: DiscoveryContentMetaTagsEntity[],
    entityManager?: EntityManager,
    optionalDiscoveryContentIDToDelete?: number,
  ): Promise<DiscoveryContentMetaTagsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      // if meet condition, then first delete existing tags by discovery content id
      if (optionalDiscoveryContentIDToDelete && optionalDiscoveryContentIDToDelete > 0) {
        await this.discoveryContentMetaTagsModel.deleteDiscoveryContentMetaTags(optionalDiscoveryContentIDToDelete, entityManager);
      }

      // if discoveryContenMetaTags array is not empty, then INSERT new tags
      // else dont insert anything and return empty array
      return discoveryContenMetaTags.length > 0
        ? await this.discoveryContentMetaTagsModel.linkDiscoveryContentMetaTags(discoveryContenMetaTags, entityManager)
        : [];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking discovery content meta tags: ${JSON.stringify(discoveryContenMetaTags)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content meta tags: ${JSON.stringify(discoveryContenMetaTags)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentMetaTagsService;
