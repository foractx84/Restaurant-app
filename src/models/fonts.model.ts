import { FontEntity } from '@/entities/font.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { FontsModelInterface } from '@/interfaces/fonts.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class FontsModel implements FontsModelInterface {
  getSelectableFonts = async (repository?: EntityManager): Promise<FontEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(FontEntity, {
        where: { is_selectable: true },
        order: { list_order: 'ASC' },
      });
    } catch (err) {
      logger.error(`Error occurred while fetching fonts - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while fetching fonts. Refer to logs for more detail.'),
      );
    }
  };
}

export default FontsModel;
