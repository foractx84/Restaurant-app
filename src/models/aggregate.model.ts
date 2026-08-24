import { AggregateModelInterface } from '@interfaces/aggregate.interface';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import { MenuItemsRestrictionsEntity } from '@entities/menuItemsRestrictions.entity';
import { MenuItemSizeEntity } from '@entities/menuItemSize.entity';
import { MenuItemsTagsEntity } from '@entities/menuItemsTags.entity';
import { MenuItemPairingsEntity } from '@entities/menuItemPairings.entity';
import { ModifierGroupToMenuItemLinkEntity } from '@entities/modifierGroupToMenuItemLink.entity';

class AggregateModel implements AggregateModelInterface {
  insertMenuItemDietaryRestrictions = async (menuItemsRestrictions: MenuItemsRestrictionsEntity[], repository: EntityManager): Promise<void> => {
    try {
      await repository.insert(MenuItemsRestrictionsEntity, menuItemsRestrictions);
    } catch (err) {
      logger.error(`Error occurred while creating menu item - dietary restrictions:` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          'Error occurred while creating menu item - dietary restriction aggregates. Refer to logs for more info.',
        ),
      );
    }
  };

  deleteMenuItemDietaryRestrictionsByMenuItemID = async (menuItemID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.delete(MenuItemsRestrictionsEntity, { menu_item_id: menuItemID });
    } catch (err) {
      logger.error(`Error occurred while deleting menu item - dietary restrictions:` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          'Error occurred while deleting menu item - dietary restrictions aggregate. Refer to logs for more info.',
        ),
      );
    }
  };

  insertMenuItemPairings = async (menuItemPairings: MenuItemPairingsEntity[], repository: EntityManager): Promise<void> => {
    try {
      await repository.insert(MenuItemPairingsEntity, menuItemPairings);
    } catch (err) {
      logger.error(`Error occurred while creating menu item pairings:` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating menu item pairings. Refer to logs for more info.'),
      );
    }
  };

  deleteMenuItemPairingsByMenuItemID = async (menuItemID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.delete(MenuItemPairingsEntity, { menu_item_id: menuItemID });
    } catch (err) {
      logger.error(`Error occurred while deleting menu item pairings for menu item: ${menuItemID}:` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting menu item pairings for menu item: ${menuItemID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertMenuItemModifierGroups = async (menuItemModifierGroups: ModifierGroupToMenuItemLinkEntity[], repository: EntityManager): Promise<void> => {
    try {
      await repository.insert(ModifierGroupToMenuItemLinkEntity, menuItemModifierGroups);
    } catch (err) {
      logger.error(`Error occurred while linking modifier groups to menu item. - ${err?.stack ?? err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while linking modifier groups to menu item. Refer to logs for more info.'),
      );
    }
  };

  deleteMenuItemModifierGroupsByMenuItemID = async (menuItemID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.delete(ModifierGroupToMenuItemLinkEntity, { menuItemID });
    } catch (err) {
      logger.error(`Error occurred while deleting links between modifier groups and menu item. - ${err?.stack ?? err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          'Error occurred while deleting links between modifier groups and menu item. Refer to logs for more info.',
        ),
      );
    }
  };

  insertMenuItemSizes = async (menuItemSizes: MenuItemSizeEntity[], repository: EntityManager): Promise<void> => {
    try {
      await repository.insert(MenuItemSizeEntity, menuItemSizes);
    } catch (err) {
      logger.error(`Error occurred while creating menu item - item sizes:` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          'Error occurred while creating menu item - item size aggregates. Refer to logs for more info.',
        ),
      );
    }
  };

  deleteMenuItemSizesByMenuItemID = async (menuItemID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.delete(MenuItemSizeEntity, { menu_item_id: menuItemID });
    } catch (err) {
      logger.error(`Error occurred while deleting menu item - item sizes:` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          'Error occurred while deleting menu item - item sizes aggregate. Refer to logs for more info.',
        ),
      );
    }
  };

  deleteMenuItemTagsByMenuItemID = async (menuItemID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.delete(MenuItemsTagsEntity, { menu_item_id: menuItemID });
    } catch (err) {
      logger.error(`Error occurred while deleting menu item - tags:` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while deleting menu item - tags aggregate. Refer to logs for more info.'),
      );
    }
  };

  insertMenuItemTags = async (menuItemsLinkTagsEntity: MenuItemsTagsEntity[], repository: EntityManager): Promise<void> => {
    try {
      await repository.insert(MenuItemsTagsEntity, menuItemsLinkTagsEntity);
    } catch (err) {
      logger.error(`Error occurred while creating menu item - tags:` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating menu item - tags. Refer to logs for more info.'),
      );
    }
  };
}

export default AggregateModel;
