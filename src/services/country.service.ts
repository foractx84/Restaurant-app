import { CountryEntity } from '@/entities/country.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { CountryModelInterface, CountryServiceInterface } from '@/interfaces/country.interface';
import { logger } from '@/utils/logger';

class CountryService implements CountryServiceInterface {
  private countryModel: CountryModelInterface;

  constructor(countryModel: CountryModelInterface) {
    this.countryModel = countryModel;
  }

  checkCountryExistsByName = async (name: string): Promise<CountryEntity> => {
    try {
      const countryExists = await this.countryModel.getCountryByCountryName(name);
      if (!countryExists) {
        logger.error(`Country ${name} does not exist in database.`);
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Country ${name} does not exist in database.`));
      }
      return countryExists;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting country by name ${name}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting country by name ${name}. Refer to logs for more info.`),
        );
      }
    }
  };
}

export default CountryService;
