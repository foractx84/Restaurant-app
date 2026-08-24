import {
  ItemSize,
  ItemSizeResponse,
  ItemSizeServiceInterface,
  ItemSizeTypeModelInterface,
  MenuItemSizeTypesDBInterface,
} from '@interfaces/itemSize.interface';
import { AggregateServiceInterface } from '@interfaces/aggregate.interface';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';

class ItemSizeService implements ItemSizeServiceInterface {
  private aggregateService: AggregateServiceInterface;
  private itemSizeTypeModel: ItemSizeTypeModelInterface;

  constructor(aggregateService: AggregateServiceInterface, itemSizeTypeModel: ItemSizeTypeModelInterface) {
    this.aggregateService = aggregateService;
    this.itemSizeTypeModel = itemSizeTypeModel;
  }

  createAllItemSizesForMenuItem = async (menuItemID: number, allItemSizes: ItemSize[], repository?: EntityManager): Promise<ItemSizeResponse[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const createdSizeTypes: ItemSizeResponse[] = [];
      for (const itemSize of allItemSizes) {
        const itemSizeType = await this.createItemSizeType(itemSize.label, itemSize.price, itemSize.priceOverride, repository);
        createdSizeTypes.push(itemSizeType);
      }
      const ids = createdSizeTypes.map(sizeType => sizeType.id);
      await this.aggregateService.createMenuItemSizes(menuItemID, ids, repository);
      return createdSizeTypes;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating all item sizes for menu item: ${menuItemID}. ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating all item sizes for menu item: ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createItemSizeType = async (label: string, price: number, priceOverride: string, repository?: EntityManager): Promise<ItemSizeResponse> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      if (priceOverride) {
        price = 0;
      } else {
        priceOverride = '';
      }
      const existingItemSizeType = await this.getItemSizeTypeByLabelAndPriceAndPriceOverride(label, price, priceOverride, repository);
      if (existingItemSizeType) {
        return this.buildItemSizeResponse(existingItemSizeType);
      } else {
        return this.buildItemSizeResponse(await this.itemSizeTypeModel.insertItemSizeType(label, price, priceOverride, repository));
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating item size type for menu item. ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating item size type for menu item. Refer to logs for more info.`),
        );
      }
    }
  };

  getItemSizeTypeByLabelAndPriceAndPriceOverride = async (
    label: string,
    price: number,
    priceOverride: string,
    repository?: EntityManager,
  ): Promise<MenuItemSizeTypesDBInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return this.itemSizeTypeModel.getItemSizeType(label, price, priceOverride, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while retrieving item size type. ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while retrieving item size type. Refer to logs for more info.`),
        );
      }
    }
  };

  buildItemSizeResponse = (itemSizeType: MenuItemSizeTypesDBInterface): ItemSizeResponse => {
    return {
      id: itemSizeType.id,
      price: itemSizeType.price,
      label: itemSizeType.label,
      priceOverride: itemSizeType.price_override,
    };
  };

  getBaseItemSizeFromAllItemSizes = (baseItemSizeID: number, allItemSizes: ItemSizeResponse[]): ItemSizeResponse => {
    return allItemSizes.find(({ id }) => id === baseItemSizeID) as ItemSizeResponse;
  };
}

export default ItemSizeService;
