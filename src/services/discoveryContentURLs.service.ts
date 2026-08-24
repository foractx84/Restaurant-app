import { CreateDiscoveryContentUrlsDto } from '@/dtos/discoveryContentUrls.dto';
import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import { PlatformENUMS } from '@/enums/discoveryURLPlatforms';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentURLsModelInterface, DiscoveryContentURLsServiceInterface } from '@/interfaces/discoveryContentURLs.interface';
import { DiscoveryContentUrlPlatformsServiceInterface } from '@/interfaces/discoveryContentUrlPlatforms.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentURLsService implements DiscoveryContentURLsServiceInterface {
  private discoveryContentURLsModel: DiscoveryContentURLsModelInterface;
  private discoveryContentUrlPlatformService: DiscoveryContentUrlPlatformsServiceInterface;

  constructor(
    discoveryContentURLsModel: DiscoveryContentURLsModelInterface,
    discoveryContentUrlPlatformService: DiscoveryContentUrlPlatformsServiceInterface,
  ) {
    this.discoveryContentURLsModel = discoveryContentURLsModel;
    this.discoveryContentUrlPlatformService = discoveryContentUrlPlatformService;
  }

  linkDiscoveryContentURLs = async (
    discoveryContentID: number,
    discoveryContentURLs: CreateDiscoveryContentUrlsDto[] | DiscoveryContentURLsEntity[],
    entityManager?: EntityManager,
    deletingExisting = false,
  ): Promise<DiscoveryContentURLsEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      // first, DELETE any existing urls if meet condition by discovery content id
      if (deletingExisting) {
        await this.discoveryContentURLsModel.deleteDiscoveryContentURLs(discoveryContentID, entityManager);
      }

      //  if discoveryContentURLs array is empty, then return empty array
      if (discoveryContentURLs.length === 0) {
        return [];
      }

      //  else get all platforms, and then INSERT new urls
      const platformsEntities = await this.discoveryContentUrlPlatformService.getAllPlatforms();
      const findPlatformID = (urlPlatform: PlatformENUMS): number | undefined => {
        return platformsEntities.find(entity => PlatformENUMS[entity.name] === urlPlatform)?.platformID;
      };

      // INSERT new urls and return result
      return await await this.discoveryContentURLsModel.linkDiscoveryContentURLs(
        discoveryContentURLs?.map(link => new DiscoveryContentURLsEntity(link.url, link.type, discoveryContentID, findPlatformID(link.platform))),
        entityManager,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking discovery content URLs: ${JSON.stringify(discoveryContentURLs)}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking discovery content URLs: ${JSON.stringify(discoveryContentURLs)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default DiscoveryContentURLsService;
