import { TapManagerError } from '@/exceptions/HttpException';
import ModifierModel from '@/models/modifier.model';
import ModifierService from '@services/modifier.service';
import { ModifierEntity } from '@/entities/modifier.entity';
import { CreateModifierRequestInterface, EditModifierRequestInterface, ModifierResponse } from '@interfaces/modifier.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/modifier.model', () => {
  const mockModifierModel = {
    findModifiersByRestaurantID: jest.fn(),
    softDeleteModifier: jest.fn(),
    upsertModifier: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierModel) };
});

const mockModifierModel = new ModifierModel();
const modifierService = new ModifierService(mockModifierModel);

describe('modifierService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createModifier', () => {
    const MODIFIER_ID = 123;
    const RESTAURANT_ID = 1;
    const MODIFIER: ModifierEntity = new ModifierEntity('Test', null, 400, 'This is a test');
    const CREATE_MODIFIER: CreateModifierRequestInterface = {
      name: 'Test',
      description: 'This is a test',
      price: 400,
    };
    it('should successfully create modifier', async () => {
      (mockModifierModel.upsertModifier as jest.MockedFunction<any>).mockImplementation((modifier: ModifierEntity) => {
        return new ModifierEntity(modifier.name, MODIFIER_ID, modifier.price, modifier.description, false);
      });

      const result = await modifierService.createModifier(CREATE_MODIFIER, RESTAURANT_ID);

      expect(mockModifierModel.upsertModifier).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        name: MODIFIER.name,
        description: MODIFIER.description,
        price: MODIFIER.price,
        modifierID: MODIFIER_ID,
        isHidden: false,
        imageURL: '',
      });
    });
    it('should throw HttpException 500 if an error occurs while creating modifier', async () => {
      (mockModifierModel.upsertModifier as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierService.createModifier(CREATE_MODIFIER, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editModifier', () => {
    const MODIFIER_ID = 123;
    const RESTAURANT_ID = 1;
    const EDIT_MODIFIER: EditModifierRequestInterface = {
      modifierID: MODIFIER_ID,
      name: 'Test 2',
      description: 'This has been edited.',
      price: 1000,
    };
    const MODIFIER: ModifierEntity = new ModifierEntity('Test 1', MODIFIER_ID, 100, 'This is a test', false, RESTAURANT_ID);
    it('should successfully edit modifier', async () => {
      (mockModifierModel.upsertModifier as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierService.editModifier(EDIT_MODIFIER, MODIFIER);

      expect(mockModifierModel.upsertModifier).toHaveBeenCalledTimes(1);
      expect(mockModifierModel.upsertModifier).toHaveBeenCalledWith(
        {
          name: 'Test 2',
          description: 'This has been edited.',
          price: 1000,
          modifierID: MODIFIER_ID,
          isHidden: false,
          restaurantID: RESTAURANT_ID,
        } as ModifierEntity,
        undefined,
      );
    });
    it('should throw HttpException 500 if an error occurs while editing modifier', async () => {
      (mockModifierModel.upsertModifier as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierService.editModifier(EDIT_MODIFIER, MODIFIER);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getModifiers', () => {
    const RESTAURANT_ID = 1;
    it('should successfully get modifiers for restaurant', async () => {
      const EXPECTED_RESPONSE: ModifierResponse[] = [
        {
          modifierID: 123,
          name: 'Test',
          price: 400,
          description: 'This is a test',
          imageURL: '',
          isHidden: false,
        },
      ];
      (mockModifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockResolvedValue([
        new ModifierEntity('Test', 123, 400, 'This is a test'),
      ]);

      const result: ModifierResponse[] = await modifierService.getModifiers(RESTAURANT_ID);

      expect(mockModifierModel.findModifiersByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockModifierModel.findModifiersByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual(EXPECTED_RESPONSE);
    });
    it('should throw HttpException 500 if an error occurs while getting modifiers for restaurant', async () => {
      (mockModifierModel.findModifiersByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierService.getModifiers(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteModifier', () => {
    const MODIFIER_ID = 123;
    it('should successfully soft delete modifier group', async () => {
      (mockModifierModel.softDeleteModifier as jest.MockedFunction<any>).mockImplementation(() => {
        /* mocking for test */
      });

      await modifierService.softDeleteModifier({ modifierID: MODIFIER_ID } as ModifierEntity);

      expect(mockModifierModel.softDeleteModifier).toHaveBeenCalledTimes(1);
      expect(mockModifierModel.softDeleteModifier).toHaveBeenCalledWith(MODIFIER_ID, undefined);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting modifier', async () => {
      (mockModifierModel.softDeleteModifier as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierService.softDeleteModifier({ modifierID: MODIFIER_ID } as ModifierEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
