import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { ProductPriceModelInterface } from '@interfaces/productPrice.interface';
import { ProductPriceEntity } from '@entities/productPrice.entity';

class ProductPriceModel implements ProductPriceModelInterface {
  findProductPriceByStripePriceID = async (stripePriceID: string, repository?: EntityManager): Promise<ProductPriceEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository
        .getRepository(ProductPriceEntity)
        .createQueryBuilder('prices')
        .leftJoinAndSelect('prices.product_id', 'product', 'product.deleted_at IS NULL')
        .leftJoinAndSelect('prices.payment_plan_id', 'payment_plan')
        .where('prices.stripe_price_id = :stripePriceID', { stripePriceID })
        .andWhere('prices.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      logger.error(`Error with selecting product price with stripe price id: '${stripePriceID}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error with selecting product price with stripe price id: '${stripePriceID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default ProductPriceModel;
