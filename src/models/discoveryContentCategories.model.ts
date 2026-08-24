import { DiscoveryContentCategoriesEntity } from '@/entities/discoveryContentCategories.entity';
import { HttpException, InternalErrorCode, getErrorPayload } from '@/exceptions/HttpException';
import { DiscoveryContentCategoriesModelInterface } from '@/interfaces/discoveryContentCategories.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class DiscoveryContentCategoriesModel implements DiscoveryContentCategoriesModelInterface {
  getAllCategories = async (entityManager?: EntityManager): Promise<DiscoveryContentCategoriesEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.find(DiscoveryContentCategoriesEntity);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching all discovery categories. - ${err?.stack ?? err}`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching all discovery categories.`));
      }
    }
  };
}

export default DiscoveryContentCategoriesModel;
