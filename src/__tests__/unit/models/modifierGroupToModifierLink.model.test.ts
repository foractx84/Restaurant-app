import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ModifierGroupToModifierLinkModel from '@models/modifierGroupToModifierLink.model';
import { ModifierGroupToModifierLinkEntity } from '@entities/modifierGroupToModifierLink.entity';
import { ModifierGroupToModifierLinkInterface } from '@interfaces/modifierGroupToModifierLink.interface';

jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, ormConnection: jest.fn() };
});

const modifierGroupToModifierLinkModel = new ModifierGroupToModifierLinkModel();

describe('ModifierGroupToModifierLinkModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertModifierGroupToModifierLinks', () => {
    it('saves the provided links, nesting a modifier group under a parent modifier', async () => {
      const links: ModifierGroupToModifierLinkInterface[] = [{ modifierGroupID: 10, modifierID: 20, listOrder: 0 }];
      const save = jest.fn().mockResolvedValueOnce(links);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ save });

      await modifierGroupToModifierLinkModel.insertModifierGroupToModifierLinks(links);

      expect(save).toHaveBeenCalledWith(ModifierGroupToModifierLinkEntity, links);
    });

    it('throws HttpException 500 if saving fails', async () => {
      const save = jest.fn().mockRejectedValueOnce(new Error('db down'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ save });

      try {
        await modifierGroupToModifierLinkModel.insertModifierGroupToModifierLinks([{ modifierGroupID: 10, modifierID: 20, listOrder: 0 }]);
        fail('expected insertModifierGroupToModifierLinks to throw');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('deleteModifierGroupsLinkedByModifierID', () => {
    it('deletes links scoped to the given parent modifier id', async () => {
      const deleteFn = jest.fn().mockResolvedValueOnce(undefined);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ delete: deleteFn });

      await modifierGroupToModifierLinkModel.deleteModifierGroupsLinkedByModifierID(20);

      expect(deleteFn).toHaveBeenCalledWith(ModifierGroupToModifierLinkEntity, { modifierID: 20 });
    });
  });

  describe('fetchModifierGroupLinksByModifierID', () => {
    it('returns the links for a given parent modifier id', async () => {
      const links = [{ modifierGroupID: 10, modifierID: 20, listOrder: 0 }];
      const find = jest.fn().mockResolvedValueOnce(links);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ find });

      const result = await modifierGroupToModifierLinkModel.fetchModifierGroupLinksByModifierID(20);

      expect(find).toHaveBeenCalledWith(ModifierGroupToModifierLinkEntity, { where: { modifierID: 20 } });
      expect(result).toEqual(links);
    });
  });
});
