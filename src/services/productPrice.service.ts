import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { ProductPriceModelInterface, ProductPriceServiceInterface } from '@interfaces/productPrice.interface';
import { ProductPriceEntity } from '@/entities/productPrice.entity';

class ProductPriceService implements ProductPriceServiceInterface {
  private productPriceModel: ProductPriceModelInterface;

  constructor(productPriceModel: ProductPriceModelInterface) {
    this.productPriceModel = productPriceModel;
  }

  getProductPriceByStripePriceID = async (stripePriceID: string): Promise<ProductPriceEntity> => {
    try {
      return await this.productPriceModel.findProductPriceByStripePriceID(stripePriceID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting product price by stripe price id: ${stripePriceID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting product price by stripe price id: ${stripePriceID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default ProductPriceService;
