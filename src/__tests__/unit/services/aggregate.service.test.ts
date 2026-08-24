import AggregateModel from '@/models/aggregate.model';
import AggregateService from '@services/aggregate.service';
import { ormConnection } from '@utils/dbUtils';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/aggregate.model', () => {
  const mockAggregateModel = {
    insertMenuItemDietaryRestrictions: jest.fn(),
    deleteMenuItemDietaryRestrictionsByMenuItemID: jest.fn(),
    insertMenuItemPairings: jest.fn(),
    deleteMenuItemPairingsByMenuItemID: jest.fn(),
    insertMenuItemSizes: jest.fn(),
    deleteMenuItemSizesByMenuItemID: jest.fn(),
    deleteMenuItemTagsByMenuItemID: jest.fn(),
    insertMenuItemTags: jest.fn(),
    insertMenuItemModifierGroups: jest.fn(),
    deleteMenuItemModifierGroupsByMenuItemID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAggregateModel) };
});

const mockAggregateModel = new AggregateModel();
const aggregateService = new AggregateService(mockAggregateModel);

describe('aggregateService', () => {
  const MENU_ITEM_ID = 1;
  afterEach(() => {
    jest.resetAllMocks();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('createMenuItemDietaryRestrictions', () => {
    const restrictionIDs = [1, 2];
    it('should successfully create multiple menu item dietary restriction aggregates with no repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.createMenuItemDietaryRestrictions(MENU_ITEM_ID, restrictionIDs);

      expect(mockAggregateModel.insertMenuItemDietaryRestrictions).toHaveBeenCalledTimes(1);
    });
    it('should successfully create multiple menu item dietary restriction aggregates with repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateService.createMenuItemDietaryRestrictions(MENU_ITEM_ID, restrictionIDs, REPOSITORY);

      expect(mockAggregateModel.insertMenuItemDietaryRestrictions).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while creating menu item dietary restriction aggregates', async () => {
      (mockAggregateModel.insertMenuItemDietaryRestrictions as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };
      try {
        await aggregateService.createMenuItemDietaryRestrictions(MENU_ITEM_ID, restrictionIDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while creating menu item dietary restriction aggregates', async () => {
      (mockAggregateModel.insertMenuItemDietaryRestrictions as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateService.createMenuItemDietaryRestrictions(MENU_ITEM_ID, restrictionIDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('deleteMenuItemDietaryRestrictionsByMenuItemID', () => {
    it('should successfully delete menu item dietary restriction aggregates by menu item id no repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.deleteMenuItemDietaryRestrictionsByMenuItemID(MENU_ITEM_ID);

      expect(mockAggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete menu item dietary restriction aggregates by menu item id with repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      await aggregateService.deleteMenuItemDietaryRestrictionsByMenuItemID(MENU_ITEM_ID, REPOSITORY);

      expect(mockAggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException if any error occurs while deleting menu item dietary restriction aggregates', async () => {
      (mockAggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      try {
        await aggregateService.deleteMenuItemDietaryRestrictionsByMenuItemID(MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while deleting menu item dietary restriction aggregates', async () => {
      (mockAggregateModel.deleteMenuItemDietaryRestrictionsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await aggregateService.deleteMenuItemDietaryRestrictionsByMenuItemID(MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('createMenuItemModifierGroups', () => {
    const modifierGroupIDs = [1, 2];
    it('should successfully create multiple links to modifier groups and a menu item with no repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);
      (mockAggregateModel.insertMenuItemModifierGroups as jest.MockedFunction<any>).mockResolvedValue(true);

      await aggregateService.createMenuItemModifierGroups(MENU_ITEM_ID, modifierGroupIDs);

      expect(mockAggregateModel.insertMenuItemModifierGroups).toHaveBeenCalledTimes(1);
    });
    it('should successfully create multiple links to modifier groups and a menu item with repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateService.createMenuItemModifierGroups(MENU_ITEM_ID, modifierGroupIDs, REPOSITORY);

      expect(mockAggregateModel.insertMenuItemModifierGroups).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while creating multiple links to modifier groups and a menu item', async () => {
      (mockAggregateModel.insertMenuItemModifierGroups as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      try {
        await aggregateService.createMenuItemModifierGroups(MENU_ITEM_ID, modifierGroupIDs);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while creating multiple links to modifier groups and a menu item', async () => {
      (mockAggregateModel.insertMenuItemModifierGroups as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await aggregateService.createMenuItemModifierGroups(MENU_ITEM_ID, modifierGroupIDs);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });

  describe('deleteMenuItemModifierGroupsByMenuItemID', () => {
    it('should successfully delete links of menu item and modifier groups with no repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.deleteMenuItemModifierGroupsByMenuItemID(MENU_ITEM_ID);

      expect(mockAggregateModel.deleteMenuItemModifierGroupsByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete links of menu item and modifier groups with repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      await aggregateService.deleteMenuItemModifierGroupsByMenuItemID(MENU_ITEM_ID, REPOSITORY);

      expect(mockAggregateModel.deleteMenuItemModifierGroupsByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while deleting links of menu item and modifier groups', async () => {
      (mockAggregateModel.deleteMenuItemModifierGroupsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      try {
        await aggregateService.deleteMenuItemModifierGroupsByMenuItemID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while deleting links of menu item and modifier groups', async () => {
      (mockAggregateModel.deleteMenuItemModifierGroupsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await aggregateService.deleteMenuItemModifierGroupsByMenuItemID(MENU_ITEM_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('createMenuItemPairings', () => {
    const pairingItemIDs = [1, 2];
    it('should successfully create multiple menu item pairings with no repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.createMenuItemPairings(MENU_ITEM_ID, pairingItemIDs);

      expect(mockAggregateModel.insertMenuItemPairings).toHaveBeenCalledTimes(1);
    });
    it('should successfully create multiple menu item pairings with repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateService.createMenuItemPairings(MENU_ITEM_ID, pairingItemIDs, REPOSITORY);

      expect(mockAggregateModel.insertMenuItemPairings).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while creating menu item pairings', async () => {
      (mockAggregateModel.insertMenuItemPairings as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };
      try {
        await aggregateService.createMenuItemPairings(MENU_ITEM_ID, pairingItemIDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while creating menu item pairings', async () => {
      (mockAggregateModel.insertMenuItemPairings as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateService.createMenuItemPairings(MENU_ITEM_ID, pairingItemIDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('deleteMenuItemPairingsByMenuItemID', () => {
    it('should successfully delete menu item pairings by menu item id no repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.deleteMenuItemPairingsByMenuItemID(MENU_ITEM_ID);

      expect(mockAggregateModel.deleteMenuItemPairingsByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete menu item pairings by menu item id with repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      await aggregateService.deleteMenuItemPairingsByMenuItemID(MENU_ITEM_ID, REPOSITORY);

      expect(mockAggregateModel.deleteMenuItemPairingsByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while deleting menu item pairings', async () => {
      (mockAggregateModel.deleteMenuItemPairingsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      try {
        await aggregateService.deleteMenuItemPairingsByMenuItemID(MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while deleting menu item pairings', async () => {
      (mockAggregateModel.deleteMenuItemPairingsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await aggregateService.deleteMenuItemPairingsByMenuItemID(MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('createMenuItemSizes', () => {
    const itemSizeIDs = [1, 2];
    it('should successfully create multiple menu item sizes, no repository provided', async () => {
      const itemSizeIDs = [1, 2];
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.createMenuItemSizes(MENU_ITEM_ID, itemSizeIDs);

      expect(mockAggregateModel.insertMenuItemSizes).toHaveBeenCalledTimes(1);
    });
    it('should successfully create multiple menu item sizes with repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateService.createMenuItemSizes(MENU_ITEM_ID, itemSizeIDs, REPOSITORY);

      expect(mockAggregateModel.insertMenuItemSizes).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while creating menu item sizes', async () => {
      (mockAggregateModel.insertMenuItemSizes as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      try {
        await aggregateService.createMenuItemSizes(MENU_ITEM_ID, itemSizeIDs);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while creating menu item sizes', async () => {
      (mockAggregateModel.insertMenuItemSizes as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await aggregateService.createMenuItemSizes(MENU_ITEM_ID, itemSizeIDs);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('deleteMenuItemSizesByMenuItemID', () => {
    it('should successfully delete menu item sizes by menu item id no repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.deleteMenuItemSizesByMenuItemID(MENU_ITEM_ID);

      expect(mockAggregateModel.deleteMenuItemSizesByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete menu item sizes by menu item id with repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      await aggregateService.deleteMenuItemSizesByMenuItemID(MENU_ITEM_ID, REPOSITORY);

      expect(mockAggregateModel.deleteMenuItemSizesByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while deleting menu item sizes by menu item id', async () => {
      const deleteFn = jest.fn().mockImplementation(() => {
        throw Error;
      });
      const REPOSITORY: any = {
        deleteFn,
      };

      try {
        await aggregateService.deleteMenuItemSizesByMenuItemID(MENU_ITEM_ID, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAggregateModel.deleteMenuItemSizesByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should throw some HttpException if HttpException error occurs while deleting menu item sizes by menu item id', async () => {
      const deleteFn = jest.fn().mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      const REPOSITORY: any = {
        deleteFn,
      };

      try {
        await aggregateService.deleteMenuItemSizesByMenuItemID(MENU_ITEM_ID, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAggregateModel.deleteMenuItemSizesByMenuItemID).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuItemTagsByMenuItemID', () => {
    it('should successfully delete menu item tag aggregates by menu item id no repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.deleteMenuItemTagsByMenuItemID(MENU_ITEM_ID);

      expect(mockAggregateModel.deleteMenuItemTagsByMenuItemID).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete menu item tag aggregates by menu item id with repository provided', async () => {
      const deleteFn = jest.fn();
      const REPOSITORY: any = {
        deleteFn,
      };

      await aggregateService.deleteMenuItemTagsByMenuItemID(MENU_ITEM_ID, REPOSITORY);

      expect(mockAggregateModel.deleteMenuItemTagsByMenuItemID).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException if any error occurs while deleting menu item tag aggregates', async () => {
      (mockAggregateModel.deleteMenuItemTagsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      try {
        await aggregateService.deleteMenuItemTagsByMenuItemID(MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while deleting menu item tag aggregates', async () => {
      (mockAggregateModel.deleteMenuItemTagsByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await aggregateService.deleteMenuItemTagsByMenuItemID(MENU_ITEM_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('createMenuItemTagsByMenuItemID', () => {
    const tagIDs = [1];
    it('should successfully create menu item tag aggregates with no repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(() => REPOSITORY);

      await aggregateService.createMenuItemTagsByMenuItemID(MENU_ITEM_ID, tagIDs);

      expect(mockAggregateModel.insertMenuItemTags).toHaveBeenCalledTimes(1);
    });
    it('should successfully create multiple menu item tag aggregates with repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await aggregateService.createMenuItemTagsByMenuItemID(MENU_ITEM_ID, tagIDs, REPOSITORY);

      expect(mockAggregateModel.insertMenuItemTags).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException if any error occurs while creating menu item tag aggregates', async () => {
      (mockAggregateModel.insertMenuItemTags as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };
      try {
        await aggregateService.createMenuItemTagsByMenuItemID(MENU_ITEM_ID, tagIDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while creating menu item tag aggregates', async () => {
      (mockAggregateModel.insertMenuItemTags as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      try {
        await aggregateService.createMenuItemTagsByMenuItemID(MENU_ITEM_ID, tagIDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
