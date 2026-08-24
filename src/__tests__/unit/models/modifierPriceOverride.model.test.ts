import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ModifierPriceOverrideModel from '@models/modifierPriceOverride.model';
import { ModifierPriceOverrideEntity } from '@entities/modifierPriceOverride.entity';

jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, ormConnection: jest.fn() };
});

const modifierPriceOverrideModel = new ModifierPriceOverrideModel();
const MODIFIER_ID = 20;

describe('ModifierPriceOverrideModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('createModifierPriceOverride', () => {
    it('saves an override rule scoped to external_party and rule_type/rule_value', async () => {
      const override = new ModifierPriceOverrideEntity(MODIFIER_ID, 'otter', 'SERVICE', 'ubereats', 599);
      const save = jest.fn().mockResolvedValueOnce(override);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ save });

      const result = await modifierPriceOverrideModel.createModifierPriceOverride(override);

      expect(save).toHaveBeenCalledWith(ModifierPriceOverrideEntity, override);
      expect(result).toEqual(override);
    });

    it('throws HttpException 500 if saving fails', async () => {
      const override = new ModifierPriceOverrideEntity(MODIFIER_ID, 'otter', 'SERVICE', 'ubereats', 599);
      const save = jest.fn().mockRejectedValueOnce(new Error('db down'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ save });

      try {
        await modifierPriceOverrideModel.createModifierPriceOverride(override);
        fail('expected createModifierPriceOverride to throw');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('fetchModifierPriceOverridesByModifierID', () => {
    it('returns the override rules for a given modifier', async () => {
      const overrides = [new ModifierPriceOverrideEntity(MODIFIER_ID, 'otter', 'SERVICE', 'ubereats', 599)];
      const find = jest.fn().mockResolvedValueOnce(overrides);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ find });

      const result = await modifierPriceOverrideModel.fetchModifierPriceOverridesByModifierID(MODIFIER_ID);

      expect(find).toHaveBeenCalledWith(ModifierPriceOverrideEntity, { where: { modifierID: MODIFIER_ID } });
      expect(result).toEqual(overrides);
    });
  });

  describe('softDeleteModifierPriceOverridesByModifierID', () => {
    it('soft deletes all override rules for a given modifier', async () => {
      const update = jest.fn().mockResolvedValueOnce(undefined);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ update });

      await modifierPriceOverrideModel.softDeleteModifierPriceOverridesByModifierID(MODIFIER_ID);

      expect(update).toHaveBeenCalledWith(ModifierPriceOverrideEntity, { modifierID: MODIFIER_ID }, { deletedAt: expect.any(Date) });
    });
  });
});
