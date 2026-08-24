import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { TitlesDBInterface, TitlesModelInterface } from '@interfaces/titles.interface';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { TitleEntity } from '@entities/title.entity';

class TitlesModel implements TitlesModelInterface {
  getTitleByName = async (titleName: string, repository?: EntityManager): Promise<TitlesDBInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const titleRepository = repository.getRepository(TitleEntity);
      const result = await titleRepository
        .createQueryBuilder('title')
        .select('title.id', 'titleID')
        .addSelect('title.name', 'name')
        .where('title.name = :titleName', { titleName })
        .getRawMany();
      return result[0];
    } catch (err) {
      logger.warn(`Get Title Error for titleName: ${titleName} - ` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while fetching a manager title'));
    }
  };

  insertTitle = async (titleName: string, repository?: EntityManager): Promise<TitlesDBInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return (await repository.insert(TitleEntity, { name: titleName })).raw[0] as unknown as TitlesDBInterface;
    } catch (err) {
      logger.warn(`Insert Title Error for titleName: ${titleName} - ` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while inserting a manager title'));
    }
  };

  getTitles = async (repository?: EntityManager): Promise<TitleEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(TitleEntity, {
        order: { name: 'ASC' },
      });
    } catch (err) {
      logger.error(`Error occurred while getting titles - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while getting titles. Refer to logs for more detail.'),
      );
    }
  };
}

export default TitlesModel;
