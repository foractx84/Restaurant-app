import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentMediaModelInterface, DiscoveryContentMediaServiceInterface } from '@/interfaces/discoveryContentMedia.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentMediaService implements DiscoveryContentMediaServiceInterface {
  private discoveryContentMediaModel: DiscoveryContentMediaModelInterface;

  constructor(discoveryContentMediaModel: DiscoveryContentMediaModelInterface) {
    this.discoveryContentMediaModel = discoveryContentMediaModel;
  }

  linkDiscoveryContentMedia = async (
    discoveryContenMedia: DiscoveryContentMediaEntity[],
    entityManager?: EntityManager,
    deleteExisting = false,
  ): Promise<DiscoveryContentMediaEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      // first, DELETE existing media by discovery content it from media linking table for discovery item
      // (Tables: discoveryItem <- mediaLinkingTable -> mediaLibrary)
      if (deleteExisting) {
        await this.discoveryContentMediaModel.deleteDiscoveryContentMedia(discoveryContenMedia[0].discoveryContentID, entityManager);
      }

      // second, INSERT media into media linking table for discovery item
      // (Tables: discoveryItem <- mediaLinkingTable -> mediaLibrary)
      return await this.discoveryContentMediaModel.linkDiscoveryContentMedia(discoveryContenMedia, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking discovery content media: ${JSON.stringify(discoveryContenMedia)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content media: ${JSON.stringify(discoveryContenMedia)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentMediaService;
