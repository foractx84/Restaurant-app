import { ItemSizeTypeModelInterface, MenuItemSizeTypesDBInterface } from '@interfaces/itemSize.interface';
import { EntityManager } from 'typeorm';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuItemSizeTypesEntity } from '@entities/menuItemSizeTypes.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class ItemSizeTypeModel implements ItemSizeTypeModelInterface {
  getItemSizeType = async (label: string, price: number, priceOverride: string, repository: EntityManager): Promise<MenuItemSizeTypesDBInterface> => {
    try {
      return repository.findOne(MenuItemSizeTypesEntity, { label, price, price_override: priceOverride });
    } catch (err) {
      logger.warn(`Error getting menu item size type with label '${label}' and price ${price}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error getting menu item size type with label '${label}' and price ${price}`),
      );
    }
  };

  insertItemSizeType = async (
    label: string,
    price: number,
    priceOverride: string,
    repository: EntityManager,
  ): Promise<MenuItemSizeTypesDBInterface> => {
    try {
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const menuItemResult = await customRepository.insert('menu_items_size_types', [{ label, price, price_override: priceOverride }]);
      const databaseResult = classToPlain(menuItemResult.raw[0]);
      return databaseResult as MenuItemSizeTypesDBInterface;
    } catch (err) {
      logger.error(
        `Error occurred while creating menu item size type:  { label: ${label}, price: ${price}, price_override: ${priceOverride} } - ` + err,
      );
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating menu item. Refer to logs for more info.'),
      );
    }
  };
}

export default ItemSizeTypeModel;
