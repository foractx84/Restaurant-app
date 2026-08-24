import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { DietaryRestrictionsModelInterface } from '@interfaces/dietaryRestrictions.interface';
import { DietaryRestrictionEntity } from '@entities/dietaryRestriction.entity';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';

class DietaryRestrictionsModel implements DietaryRestrictionsModelInterface {
  findDietaryRestrictionsByIDs = async (restrictionIDs: number[]): Promise<DietaryRestrictionEntity[]> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      return await ormConn.findByIds(DietaryRestrictionEntity, restrictionIDs);
    } catch (err) {
      logger.warn(`Error occurred while getting dietary restrictions - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting dietary restrictions. Refer to the logs for more detail.`),
      );
    }
  };

  getAllRestrictions = async (repository?: EntityManager): Promise<DietaryRestrictionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(DietaryRestrictionEntity, { order: { name: 'ASC' } });
    } catch (err) {
      logger.warn(`Error occurred while getting dietary restrictions - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting dietary restrictions. Refer to the logs for more detail.`),
      );
    }
  };
}

export default DietaryRestrictionsModel;
