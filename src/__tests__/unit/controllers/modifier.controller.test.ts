import { NextFunction, Request, Response } from 'express-serve-static-core';
import ModifierController from '@controllers/modifier.controller';
import { ModifierResponse, ModifierModelInterface } from '@interfaces/modifier.interface';
import ModifierService from '@services/modifier.service';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/modifier.service', () => {
  const mockedModifierService = {
    createModifier: jest.fn(),
    editModifier: jest.fn(),
    getModifiers: jest.fn(),
    softDeleteModifier: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockedModifierService),
  };
});

const mockModifierService = new ModifierService({} as ModifierModelInterface);
// create test controller object
const modifierController = new ModifierController(mockModifierService);

describe('modifierController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createModifier', () => {
    it('should successfully create modifier', async () => {
      const modifierResponse: ModifierResponse = {
        modifierID: 1011,
        name: 'TEST 12',
        description: 'DESCRIPTION',
        price: 199,
        isHidden: false,
      };
      // set up mock menus service to return our mock response to controller
      (mockModifierService.createModifier as jest.MockedFunction<any>).mockResolvedValueOnce(modifierResponse);

      // mock a request needed by controller
      const mReq = {
        body: {
          name: 'TEST 12',
          description: 'DESCRIPTION',
          price: 199,
        },
      };

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await modifierController.createModifier(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockModifierService.createModifier).toHaveBeenCalledWith(mReq.body, 1);
      expect(responseObject).toEqual(modifierResponse);
    });
    it('should not create modifier because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierController.createModifier(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierService.createModifier).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editModifier', () => {
    it('should successfully edit modifier', async () => {
      (mockModifierService.editModifier as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      // mock a request needed by controller
      const mReq = {
        body: {
          modifierID: 1,
          name: 'TEST 2',
          description: 'This is a test',
          price: 100,
        },
      };

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        locals: { modifier: { modifierID: 1, name: 'TEST 1', description: 'description', price: 0 } },
      };

      // call on controller as the router would
      await modifierController.editModifier(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockModifierService.editModifier).toHaveBeenCalled();
    });
    it('should not edit modifier because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierController.editModifier(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierService.editModifier).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getModifiers', () => {
    it('should successfully get modifiers', async () => {
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
      (mockModifierService.getModifiers as jest.MockedFunction<any>).mockResolvedValueOnce(modifierResponses);
      let responseObject = {};
      const mReq: Partial<Request> = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };
      await modifierController.getModifiers(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockModifierService.getModifiers).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(modifierResponses);
    });
    it('should not get modifiers because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = undefined; // request to force controller to throw error
      const mNext = jest.fn();
      await modifierController.getModifiers(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierService.getModifiers).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteModifier', () => {
    it('should successfully delete modifier', async () => {
      (mockModifierService.softDeleteModifier as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      // mock a request needed by controller
      const mReq = {};

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        locals: { modifier: { modifierID: 1, name: 'TEST 1', description: 'description', price: 0 } },
      };

      // call on controller as the router would
      await modifierController.deleteModifier(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockModifierService.softDeleteModifier).toHaveBeenCalled();
    });
    it('should not delete modifier because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await modifierController.deleteModifier(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockModifierService.softDeleteModifier).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
