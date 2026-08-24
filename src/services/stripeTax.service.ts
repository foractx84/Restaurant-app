import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { StripeTaxModelInterface, StripeTaxServiceInterface } from '@/interfaces/stripeTax.interface';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import { StripeTaxEntity } from '@/entities/stripeTax.entity';

class StripeTaxService implements StripeTaxServiceInterface {
  private stripeTaxModel: StripeTaxModelInterface;

  constructor(stripeTaxModel: StripeTaxModelInterface) {
    this.stripeTaxModel = stripeTaxModel;
  }

  getStripeTaxCodes = async (repository?: EntityManager): Promise<StripeTaxEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.stripeTaxModel.getStripeTaxCodes(repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting stripe tax codes. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating stripe tax codes. Refer to logs for more info.`),
        );
      }
    }
  };
}

export default StripeTaxService;
