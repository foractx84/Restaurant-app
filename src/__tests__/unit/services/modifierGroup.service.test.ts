import { TapManagerError } from '@/exceptions/HttpException';
import ModifierGroupModel from '@/models/modifierGroup.model';
import ModifierGroupService from '@/services/modifierGroup.service';
import {
  CreateModifierGroupRequestInterface,
  EditModifierGroupRequestInterface,
  GetModifierGroupResponseInterface,
  LinkModifiersToModifierGroupRequestInterface,
} from '@/interfaces/modifierGroup.interface';
import { ormConnection } from '@/utils/dbUtils';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { EntityManager } from 'typeorm';
import ModifierToModifierGroupLinkService from '@services/modifierToModifierGroupLink.service';
import ModifierToModifierGroupLinkModel from '@/models/modifierToModifierGroupLink.model';
import { ModifierResponse } from '@/interfaces/modifier.interface';
import { ModifierEntity } from '@/entities/modifier.entity';
import { MediaEntity } from '@/entities/media.entity';
import { IMAGE_TYPE_ID } from '@/constants/media.constants';

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
jest.mock('@/models/modifierGroup.model', () => {
  const mockModifierModel = {
    fetchModifierGroupByNameAndRestaurantID: jest.fn(),
    fetchModifierGroupsByRestaurantID: jest.fn(),
    upsertModifierGroup: jest.fn(),
    softDeleteModifierGroup: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierModel) };
});
jest.mock('@/services/modifierToModifierGroupLink.service', () => {
  const mockModifierToModifierGroupLinkService = {
    deleteModifiersLinkedByModifierGroupID: jest.fn(),
    insertModifierToModifierGroupLinks: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierToModifierGroupLinkService) };
});

const mockModifierToModifierGroupLinkService = new ModifierToModifierGroupLinkService(new ModifierToModifierGroupLinkModel());
const mockModifierGroupModel = new ModifierGroupModel();
const modifierGroupService = new ModifierGroupService(mockModifierGroupModel, mockModifierToModifierGroupLinkService);

describe('modifierGroupService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createModifierGroup', () => {
    const RESTAURANT_ID = 1;
    const CREATE_MODIFIER_GROUP: CreateModifierGroupRequestInterface = {
      label: 'Test',
      name: 'Name_test',
      modifierIDs: [1, 2],
    };
    it('should successfully create modifier group', async () => {
      (mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
      await modifierGroupService.createModifierGroup(CREATE_MODIFIER_GROUP, RESTAURANT_ID);

      expect(mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID).toHaveBeenCalledWith(CREATE_MODIFIER_GROUP.name, RESTAURANT_ID);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 error for create modifier group if modifier group exists for restaurant with the same name', async () => {
      (mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
        CREATE_MODIFIER_GROUP.name,
        RESTAURANT_ID,
      );

      const transaction = jest.fn();

      try {
        await modifierGroupService.createModifierGroup(CREATE_MODIFIER_GROUP, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID).toHaveBeenCalledWith(CREATE_MODIFIER_GROUP.name, RESTAURANT_ID);
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw HttpException 500 if an error occurs while creating modifier', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupService.createModifierGroup(CREATE_MODIFIER_GROUP, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editModifierGroup', () => {
    const MODIFIER_GROUP_ID = 123;
    const RESTAURANT_ID = 1;
    const EDIT_MODIFIER_GROUP: EditModifierGroupRequestInterface = {
      modifierGroupID: MODIFIER_GROUP_ID,
      name: 'Test 2',
      label: 'This is an edited label',
    };
    const MODIFIER_GROUP: ModifierGroupEntity = new ModifierGroupEntity('This is a label', 'Test Item', false, RESTAURANT_ID, MODIFIER_GROUP_ID);
    it('should successfully edit modifier group', async () => {
      (mockModifierGroupModel.upsertModifierGroup as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierGroupService.editModifierGroup(EDIT_MODIFIER_GROUP, MODIFIER_GROUP);

      expect(mockModifierGroupModel.upsertModifierGroup).toHaveBeenCalledTimes(1);
      expect(mockModifierGroupModel.upsertModifierGroup).toHaveBeenCalledWith(
        {
          name: 'Test 2',
          label: 'This is an edited label',
          modifierGroupID: MODIFIER_GROUP_ID,
          isHidden: false,
          restaurantID: RESTAURANT_ID,
        } as ModifierGroupEntity,
        undefined,
      );
    });
    it('should successfully edit modifier group when name provided in request but for the same modifier group', async () => {
      (mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        return new ModifierGroupEntity('This is a label', 'Test 2', false, RESTAURANT_ID, MODIFIER_GROUP_ID);
      });
      (mockModifierGroupModel.upsertModifierGroup as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierGroupService.editModifierGroup(EDIT_MODIFIER_GROUP, MODIFIER_GROUP);

      expect(mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID).toHaveBeenCalledWith(EDIT_MODIFIER_GROUP.name, RESTAURANT_ID);
      expect(mockModifierGroupModel.upsertModifierGroup).toHaveBeenCalledTimes(1);
      expect(mockModifierGroupModel.upsertModifierGroup).toHaveBeenCalledWith(
        {
          name: 'Test 2',
          label: 'This is an edited label',
          modifierGroupID: MODIFIER_GROUP_ID,
          isHidden: false,
          restaurantID: RESTAURANT_ID,
        } as ModifierGroupEntity,
        undefined,
      );
    });
    it('should throw HttpException 409 if name is provided that exists for restaurant while editing modifier group', async () => {
      (mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        return new ModifierGroupEntity('This is a label', 'Test 2', false, RESTAURANT_ID, 124);
      });

      try {
        await modifierGroupService.editModifierGroup(EDIT_MODIFIER_GROUP, MODIFIER_GROUP);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });

    it('should throw HttpException 500 if an error occurs while editing modifier group', async () => {
      (mockModifierGroupModel.upsertModifierGroup as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupService.editModifierGroup(EDIT_MODIFIER_GROUP, MODIFIER_GROUP);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('fetchModifierGroupByNameAndRestaurantID', () => {
    const RESTAURANT_ID = 1;
    const NAME = 'test_name';
    it('should successfully fetch modifier group by name and restaurantID', async () => {
      await modifierGroupService.fetchModifierGroupByNameAndRestaurantID(NAME, RESTAURANT_ID);

      expect(mockModifierGroupModel.fetchModifierGroupByNameAndRestaurantID).toHaveBeenCalledWith(NAME, RESTAURANT_ID);
    });
    it('should throw HttpException 500 if an error occurs while fetching modifier group by name and restaurantID', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupService.fetchModifierGroupByNameAndRestaurantID(NAME, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('linkAndClearModifiers', () => {
    const MODIFIER_GROUP_ID = 12;
    const MODIFIER_IDS = [1, 2];
    it('should successfully link and clear modifiers for modifier group', async () => {
      (mockModifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });
      (mockModifierToModifierGroupLinkService.insertModifierToModifierGroupLinks as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierGroupService.linkAndClearModifiers(MODIFIER_IDS, MODIFIER_GROUP_ID, true, {} as EntityManager);

      expect(mockModifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID).toHaveBeenCalledTimes(1);
      expect(mockModifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID).toHaveBeenCalledWith(MODIFIER_GROUP_ID, {});
      expect(mockModifierToModifierGroupLinkService.insertModifierToModifierGroupLinks).toHaveBeenCalledTimes(1);
    });
    it('should successfully link modifiers to modifier group', async () => {
      (mockModifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });
      (mockModifierToModifierGroupLinkService.insertModifierToModifierGroupLinks as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierGroupService.linkAndClearModifiers(MODIFIER_IDS, MODIFIER_GROUP_ID, false, {} as EntityManager);

      expect(mockModifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID).not.toHaveBeenCalled();
      expect(mockModifierToModifierGroupLinkService.insertModifierToModifierGroupLinks).toHaveBeenCalledTimes(1);
    });
  });
  describe('linkModifiersToModifierGroup', () => {
    const LINK_MODIFIER_GROUP: LinkModifiersToModifierGroupRequestInterface = {
      modifierGroupID: 12,
      modifierIDs: [1, 2],
    };
    it('should successfully link modifiers to modifier group', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
      await modifierGroupService.linkModifiersToModifierGroup(LINK_MODIFIER_GROUP);

      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while linking modifiers to modifier group', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupService.linkModifiersToModifierGroup(LINK_MODIFIER_GROUP);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteModifierGroup', () => {
    const MODIFIER_GROUP_ID = 123;
    it('should successfully soft delete modifier group', async () => {
      (mockModifierGroupModel.softDeleteModifierGroup as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierGroupService.softDeleteModifierGroup({ modifierGroupID: MODIFIER_GROUP_ID } as ModifierGroupEntity);

      expect(mockModifierGroupModel.softDeleteModifierGroup).toHaveBeenCalledTimes(1);
      expect(mockModifierGroupModel.softDeleteModifierGroup).toHaveBeenCalledWith(MODIFIER_GROUP_ID, undefined);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting modifier group', async () => {
      (mockModifierGroupModel.softDeleteModifierGroup as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupService.softDeleteModifierGroup({ modifierGroupID: MODIFIER_GROUP_ID } as ModifierGroupEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getModifierGroups', () => {
    const RESTAURANT_ID = 1;
    const MODIFIER_GROUP_ID = 100;
    const MODIFIER_ID = 123;
    it('should successfully get modifier groups of restaurant', async () => {
      const mockModifier: ModifierEntity = new ModifierEntity('Test', MODIFIER_ID, 400, 'This is a test', false, RESTAURANT_ID);
      mockModifier.modifierMedia = [
        {
          modifierMediaID: 2,
          modifierID: MODIFIER_ID,
          mediaID: 1,
          media: new MediaEntity('test.jpeg', IMAGE_TYPE_ID, RESTAURANT_ID),
        },
      ];
      const mockModifierGroup: ModifierGroupEntity = new ModifierGroupEntity(
        'modifier_group_label',
        'modifier_name',
        false,
        RESTAURANT_ID,
        MODIFIER_GROUP_ID,
      );
      mockModifierGroup.modifierToModifierGroupLinks = [
        {
          modifierToModifierGroupLinkID: 36,
          modifierID: MODIFIER_ID,
          modifierGroupID: MODIFIER_GROUP_ID,
          listOrder: 0,
          modifier: mockModifier,
        },
      ];
      const EXPECTED_MODIFIER_RESPONSE: ModifierResponse[] = [
        {
          modifierID: 123,
          name: 'Test',
          price: 400,
          description: 'This is a test',
          imageURL: '',
          isHidden: false,
        },
      ];
      const EXPECTED_MODIFER_GROUP_RESPONSE: GetModifierGroupResponseInterface[] = [
        {
          modifierGroupID: MODIFIER_GROUP_ID,
          label: 'modifier_group_label',
          name: 'modifier_name',
          modifiers: EXPECTED_MODIFIER_RESPONSE,
        },
      ];

      (mockModifierGroupModel.fetchModifierGroupsByRestaurantID as jest.MockedFunction<any>).mockResolvedValue([mockModifierGroup]);

      const result: GetModifierGroupResponseInterface[] = await modifierGroupService.getModifierGroups(RESTAURANT_ID);

      expect(mockModifierGroupModel.fetchModifierGroupsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockModifierGroupModel.fetchModifierGroupsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual(EXPECTED_MODIFER_GROUP_RESPONSE);
    });
    it('should throw HttpException 500 if an error occurs while getting modifier groups for restaurant', async () => {
      (mockModifierGroupModel.fetchModifierGroupsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupService.getModifierGroups(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
