import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { StripeTaxEntity } from '@entities/stripeTax.entity';
import { StripeTaxModelInterface } from '@interfaces/stripeTax.interface';

class StripeTaxModel implements StripeTaxModelInterface {
  getStripeTaxCodes = async (repository?: EntityManager): Promise<StripeTaxEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(StripeTaxEntity);
    } catch (err) {
      logger.error(`Error with getting stripe tax codes - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with getting stripe tax codes. Refer to logs for more info.`),
      );
    }
  };
}

export default StripeTaxModel;
