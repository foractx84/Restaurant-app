import { CountryEntity } from '@entities/country.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { CountryModelInterface } from '@interfaces/country.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager, ILike } from 'typeorm';

class CountryModel implements CountryModelInterface {
  getCountryByCountryName = async (name: string, repository?: EntityManager): Promise<CountryEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(CountryEntity, { name: ILike(`${name}`) });
    } catch (err) {
      logger.error(`Error occurred while fetching country by name: ${name} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while fetching country by name: ${name}. Refer to logs for more detail.`),
      );
    }
  };
}

export default CountryModel;
