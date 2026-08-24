import AggregateModel from '@/models/aggregate.model';
import { ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { MenuItemsRestrictionsEntity } from '@/entities/menuItemsRestrictions.entity';
import { MenuItemSizeEntity } from '@/entities/menuItemSize.entity';
import { EntityManager } from 'typeorm';
import { MenuItemPairingsEntity } from '@/entities/menuItemPairings.entity';
import { ModifierGroupToMenuItemLinkEntity } from '@/entities/modifierGroupToMenuItemLink.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const aggregateModel = new AggregateModel();
describe('aggregateModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertMenuItemDietaryRestrictions', () => {
    const menuItemRestrictions: MenuItemsRestrictionsEntity[] = [
      {
        menu_item_id: 1,
        restriction_id: 2,
      },
    ];
    it('should successfully insert menu item restrictions', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateModel.insertMenuItemDietaryRestrictions(menuItemRestrictions, REPOSITORY as EntityManager);

      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting menu item restrictions', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateModel.insertMenuItemDietaryRestrictions(menuItemRestrictions, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuItemDietaryRestrictionsByMenuItemID', () => {
    const MENU_ITEM_ID = 1;
    it('should successfully delete menu item restrictions by menu item id', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      await aggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu item restrictions by menu item id', async () => {
      const deleteSpy = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      try {
        await aggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertMenuItemModifierGroups', () => {
    const menuItemModifierGroups: Partial<ModifierGroupToMenuItemLinkEntity>[] = [
      {
        modifierGroupID: 1,
        menuItemID: 2,
      },
    ];
    it('should successfully insert link modifier groups to menu item', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateModel.insertMenuItemModifierGroups(menuItemModifierGroups as ModifierGroupToMenuItemLinkEntity[], REPOSITORY as EntityManager);

      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while linking modifier groups to menu item', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateModel.insertMenuItemModifierGroups(menuItemModifierGroups as ModifierGroupToMenuItemLinkEntity[], REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuItemModifierGroupsByMenuItemID', () => {
    const MENU_ITEM_ID = 1;
    it('should successfully delete modifier groups linked to menu item', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      await aggregateModel.deleteMenuItemModifierGroupsByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting modifier groups linked to menu item', async () => {
      const deleteSpy = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      try {
        await aggregateModel.deleteMenuItemModifierGroupsByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertMenuItemPairings', () => {
    const menuItemPairings: MenuItemPairingsEntity[] = [
      {
        menu_item_id: 1,
        paired_item_id: 2,
      },
    ];
    it('should successfully insert menu item pairings', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateModel.insertMenuItemPairings(menuItemPairings, REPOSITORY as EntityManager);

      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting menu item pairings', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateModel.insertMenuItemPairings(menuItemPairings, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuItemPairingsByMenuItemID', () => {
    const MENU_ITEM_ID = 1;
    it('should successfully delete menu item pairings by menu item id', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      await aggregateModel.deleteMenuItemPairingsByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu item pairings by menu item id', async () => {
      const deleteSpy = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      try {
        await aggregateModel.deleteMenuItemPairingsByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertMenuItemSizes', () => {
    const menuItemSizes: MenuItemSizeEntity[] = [
      {
        menu_item_id: 1,
        item_size_id: 2,
      },
    ];
    it('should successfully insert menu item sizes', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateModel.insertMenuItemSizes(menuItemSizes, REPOSITORY);

      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting menu item sizes', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateModel.insertMenuItemSizes(menuItemSizes, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuItemSizesByMenuItemID', () => {
    const MENU_ITEM_ID = 1;
    it('should successfully delete menu item sizes by menu item id', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      await aggregateModel.deleteMenuItemSizesByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu item sizes by menu item id', async () => {
      const deleteSpy = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      try {
        await aggregateModel.deleteMenuItemSizesByMenuItemID(MENU_ITEM_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });
});
