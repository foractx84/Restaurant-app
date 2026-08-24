import { AggregateModelInterface, AggregateServiceInterface } from '@interfaces/aggregate.interface';
import { MenuItemsRestrictionsEntity } from '@/entities/menuItemsRestrictions.entity';
import { MenuItemSizeEntity } from '@/entities/menuItemSize.entity';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { MenuItemsTagsEntity } from '@/entities/menuItemsTags.entity';
import { MenuItemPairingsEntity } from '@/entities/menuItemPairings.entity';
import { ModifierGroupToMenuItemLinkEntity } from '@/entities/modifierGroupToMenuItemLink.entity';

class AggregateService implements AggregateServiceInterface {
  private aggregateModel: AggregateModelInterface;

  constructor(aggregateModel: AggregateModelInterface) {
    this.aggregateModel = aggregateModel;
  }

  createMenuItemTagsByMenuItemID = async (menuItemID: number, tagID: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const entities: MenuItemsTagsEntity[] = [];
      for (const id of tagID) {
        entities.push({
          tag_id: id,
          menu_item_id: menuItemID,
        });
      }
      await this.aggregateModel.insertMenuItemTags(entities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating menu item - tags.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating menu item - tags. Refer to logs for more info.`),
        );
      }
    }
  };

  deleteMenuItemTagsByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.aggregateModel.deleteMenuItemTagsByMenuItemID(menuItemID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting menu item - tags.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while deleting menu item - tags. Refer to logs for more info.`),
        );
      }
    }
  };

  createMenuItemDietaryRestrictions = async (menuItemID: number, dietaryRestrictionIDs: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const entities: MenuItemsRestrictionsEntity[] = [];
      for (const restrictionID of dietaryRestrictionIDs) {
        entities.push({
          restriction_id: restrictionID,
          menu_item_id: menuItemID,
        });
      }
      await this.aggregateModel.insertMenuItemDietaryRestrictions(entities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating menu item - dietary restrictions.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating menu item - dietary restrictions. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  deleteMenuItemDietaryRestrictionsByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.aggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID(menuItemID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting menu item - dietary restrictions.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting menu item - dietary restrictions. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createMenuItemPairings = async (menuItemID: number, pairingItemIDs: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const entities: MenuItemPairingsEntity[] = [];
      for (const pairingID of pairingItemIDs) {
        entities.push({
          paired_item_id: pairingID,
          menu_item_id: menuItemID,
        });
      }
      await this.aggregateModel.insertMenuItemPairings(entities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating pairings for menu item: ${menuItemID}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating pairings for menu item: ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  deleteMenuItemPairingsByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.aggregateModel.deleteMenuItemPairingsByMenuItemID(menuItemID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting pairings for menu item: ${menuItemID}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting pairings for menu item: ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createMenuItemSizes = async (menuItemID: number, itemSizeIDs: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const entities: MenuItemSizeEntity[] = [];
      for (const sizeID of itemSizeIDs) {
        entities.push({
          item_size_id: sizeID,
          menu_item_id: menuItemID,
        });
      }
      await this.aggregateModel.insertMenuItemSizes(entities, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating menu item sizes.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating menu item sizes. Refer to logs for more info.`),
        );
      }
    }
  };

  deleteMenuItemSizesByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.aggregateModel.deleteMenuItemSizesByMenuItemID(menuItemID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting menu item sizes by menu item id.` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting menu item sizes by menu item id. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createMenuItemModifierGroups = async (menuItemID: number, modifierGroupIDs: number[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const entities: Partial<ModifierGroupToMenuItemLinkEntity>[] = [];
      for (const modifierGroupID of modifierGroupIDs) {
        entities.push({
          modifierGroupID,
          menuItemID,
        });
      }
      await this.aggregateModel.insertMenuItemModifierGroups(entities as ModifierGroupToMenuItemLinkEntity[], repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking modifier groups to menu item: ${menuItemID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking modifier groups to menu item: ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  deleteMenuItemModifierGroupsByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.aggregateModel.deleteMenuItemModifierGroupsByMenuItemID(menuItemID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting modifier groups for menu item: ${menuItemID}. - ${err?.stack ?? err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting modifier groups for menu item: ${menuItemID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default AggregateService;
