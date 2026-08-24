import { DiscoveryContentCategoriesEntity } from '@/entities/discoveryContentCategories.entity';
import { DiscoveryContentUrlPlatformsEntity } from '@/entities/discoveryContentURLPlattforms.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import {
  DiscoveryContentCategoriesModelInterface,
  DiscoveryContentCategoriesServiceInterface,
} from '@/interfaces/discoveryContentCategories.interface';
import {
  DiscoveryContentUrlPlatformsModelInterface,
  DiscoveryContentUrlPlatformsServiceInterface,
} from '@/interfaces/discoveryContentUrlPlatforms.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentCategoriesService implements DiscoveryContentCategoriesServiceInterface {
  private discoveryContentCategoriesModel: DiscoveryContentCategoriesModelInterface;

  constructor(discoveryContentCategoriesModel: DiscoveryContentCategoriesModelInterface) {
    this.discoveryContentCategoriesModel = discoveryContentCategoriesModel;
  }

  getAllCategories = async (entityManager?: EntityManager): Promise<DiscoveryContentCategoriesEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await this.discoveryContentCategoriesModel.getAllCategories(entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching all discovery categories. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching all discovery categories. Refer to logs for more info.`),
        );
      }
    }
  };
}

export default DiscoveryContentCategoriesService;
