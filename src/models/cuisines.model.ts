import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { CuisinesModelInterface } from '@interfaces/cuisines.interface';
import { CuisineEntity } from '@entities/cuisine.entity';

class CuisinesModel implements CuisinesModelInterface {
  getAllCuisines = async (repository?: EntityManager): Promise<CuisineEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(CuisineEntity, { order: { name: 'ASC' } });
    } catch (err) {
      logger.warn(`Error occurred while getting cuisines - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting cuisines. Refer to the logs for more detail.`),
      );
    }
  };

  getCuisineByID = async (cuisineID: number, repository?: EntityManager): Promise<CuisineEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(CuisineEntity, { cuisine_id: cuisineID });
    } catch (err) {
      logger.warn(`Error occurred while getting cuisine by cuisineID: ${cuisineID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting cuisine by cuisineID: ${cuisineID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };
}

export default CuisinesModel;
