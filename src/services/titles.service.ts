import TitlesModel from '@/models/titles.model';
import { GetTitlesResponseInterface, TitlesServiceInterface } from '@/interfaces/titles.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { TitleEntity } from '@/entities/title.entity';

class TitlesService implements TitlesServiceInterface {
  private titlesModel: TitlesModel;

  constructor(titlesModel: TitlesModel) {
    this.titlesModel = titlesModel;
  }

  getTitles = async (): Promise<GetTitlesResponseInterface> => {
    try {
      const titles: TitleEntity[] = await this.titlesModel.getTitles();
      const formattedTitles = titles.map(title => ({ titleID: title.id, name: title.name }));
      return {
        titles: formattedTitles,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting titles.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting titles. Refer to logs for more info.`),
        );
      }
    }
  };
}

export default TitlesService;
