import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { FontListItemInterface, FontsModelInterface, FontsServiceInterface, GetFontsResponseInterface } from '@/interfaces/fonts.interface';
import { logger } from '@/utils/logger';

class FontsService implements FontsServiceInterface {
  private fontsModel: FontsModelInterface;

  constructor(fontsModel: FontsModelInterface) {
    this.fontsModel = fontsModel;
  }

  getFonts = async (): Promise<GetFontsResponseInterface> => {
    try {
      const rows = await this.fontsModel.getSelectableFonts();
      const fonts: FontListItemInterface[] = rows.map(row => ({
        title: row.title,
        category: row.category,
        usageNotes: row.usage_notes,
        listOrder: row.list_order,
      }));
      return { fonts };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Error occurred while getting fonts - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while getting fonts. Refer to logs for more info.'),
      );
    }
  };
}

export default FontsService;
