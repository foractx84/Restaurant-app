import ModifierGroupService from '@/services/modifierGroup.service';
import {
  CreateModifierGroupResponseInterface,
  GetModifierGroupResponseInterface,
  ModifierGroupModelInterface,
} from '@/interfaces/modifierGroup.interface';
import { ModifierToModifierGroupLinkServiceInterface } from '@/interfaces/modifierToModifierGroupLink.interface';
import ModifierGroupController from '@/controllers/modifierGroup.controller';
import { NextFunction, Request, Response } from 'express';
import { ModifierResponse } from '@/interfaces/modifier.interface';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/modifierGroup.service', () => {
  const mockedModifierGroupService = {
    createModifierGroup: jest.fn(),
    editModifierGroup: jest.fn(),
    getModifierGroups: jest.fn(),
    linkModifiersToModifierGroup: jest.fn(),
    softDeleteModifierGroup: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockedModifierGroupService),
  };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    imageUpload: { fields: jest.fn() },
  };
});

const mockModifierGroupService = new ModifierGroupService({} as ModifierGroupModelInterface, {} as ModifierToModifierGroupLinkServiceInterface);
// create test controller object
const modifierGroupController = new ModifierGroupController(mockModifierGroupService);
describe('modifierGroupController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createModifierGroup', () => {
    it('should successfully create modifier group', async () => {
      const modifierGroupResponse: CreateModifierGroupResponseInterface = {
        modifierGroupID: 10,
        name: 'NAME_1',
        label: 'LABEL_1',
      };
      const modifiersBeingLinked = [
        {
          modifierID: 1,
          imageURL: 'https://test.com',
          price: 100,
          name: 'test',
          description: 'blah',
        },
        {
          modifierID: 2,
          imageURL: '',
          price: 0,
          name: 'test',
          description: '',
        },
      ];
      const fullModifierGroupResponse = {
        ...modifierGroupResponse,
        modifiers: modifiersBeingLinked,
      };
      // set up mock menus service to return our mock response to controller
      (mockModifierGroupService.createModifierGroup as jest.MockedFunction<any>).mockResolvedValueOnce(modifierGroupResponse);
      // mock a request needed by controller
      const mReq = {
        body: {
          name: 'NAME_1',
          label: 'LABEL_1',
          modifierIDs: [1, 2],
        },
      };
      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1, modifiersBeingLinked },
      };
      // call on controller as the router would
      await modifierGroupController.createModifierGroup(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockModifierGroupService.createModifierGroup).toHaveBeenCalledWith(mReq.body, 1);
      expect(responseObject).toEqual(fullModifierGroupResponse);
    });
    it('should not create modifier group because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierGroupController.createModifierGroup(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierGroupService.createModifierGroup).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteModifierGroup', () => {
    it('should successfully delete modifier group', async () => {
      (mockModifierGroupService.softDeleteModifierGroup as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      // mock a request needed by controller
      const mReq = {};

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        locals: { modifier: { modifierGroupID: 1, name: 'TEST 1', label: 'description' } },
      };

      // call on controller as the router would
      await modifierGroupController.deleteModifierGroup(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockModifierGroupService.softDeleteModifierGroup).toHaveBeenCalled();
    });
    it('should not delete modifier group because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierGroupController.deleteModifierGroup(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierGroupService.softDeleteModifierGroup).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editModifier', () => {
    it('should successfully edit modifier', async () => {
      (mockModifierGroupService.editModifierGroup as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      // mock a request needed by controller
      const mReq = {
        body: {
          modifierGroupID: 1,
          name: 'TEST 2',
          label: 'This is a test',
        },
      };

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        locals: { modifier: { modifierGroupID: 1, name: 'TEST 1', label: 'description' } },
      };

      // call on controller as the router would
      await modifierGroupController.editModifierGroup(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockModifierGroupService.editModifierGroup).toHaveBeenCalled();
    });
    it('should not edit modifier because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierGroupController.editModifierGroup(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierGroupService.editModifierGroup).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkModifiersToModifierGroup', () => {
    it('should successfully link modifiers to modifier group', async () => {
      // set up mock menus service to return our mock response to controller
      (mockModifierGroupService.linkModifiersToModifierGroup as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      // mock a request needed by controller
      const mReq = {
        body: {
          modifierGroupID: 123,
          modifierIDs: [1, 2],
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };
      // call on controller as the router would
      await modifierGroupController.linkModifiersToModifierGroup(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockModifierGroupService.linkModifiersToModifierGroup).toHaveBeenCalledWith(mReq.body);
    });
    it('should not create modifier group because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierGroupController.createModifierGroup(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierGroupService.createModifierGroup).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getModifierGroups', () => {
    it('should successfully get modifier groups', async () => {
      const RESTAURANT_ID = 1;
      const MODIFIER_GROUP_ID = 100;
      const modifierResponses: ModifierResponse[] = [
        {
          modifierID: 1011,
          name: 'TEST 12',
          description: 'DESCRIPTION',
          price: 199,
          isHidden: false,
          imageURL: 'test.url',
        },
      ];
      const modifierGroupResponse: GetModifierGroupResponseInterface[] = [
        {
          modifierGroupID: MODIFIER_GROUP_ID,
          label: 'test_label',
          name: 'test_name',
          modifiers: modifierResponses,
        },
      ];
      (mockModifierGroupService.getModifierGroups as jest.MockedFunction<any>).mockResolvedValueOnce(modifierGroupResponse);
      let responseObject = {};
      const mReq: Partial<Request> = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      await modifierGroupController.getModifierGroups(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockModifierGroupService.getModifierGroups).toHaveBeenCalledTimes(1);
      expect(mockModifierGroupService.getModifierGroups).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(responseObject).toEqual(modifierGroupResponse);
    });
    it('should not get modifier groups because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = undefined; // request to force controller to throw error
      const mNext = jest.fn();
      await modifierGroupController.getModifierGroups(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierGroupService.getModifierGroups).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
