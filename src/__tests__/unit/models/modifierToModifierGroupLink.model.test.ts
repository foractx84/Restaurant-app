import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ModifierToModifierGroupLinkModel from '@/models/modifierToModifierGroupLink.model';
import { ModifierToModifierGroupLinkInterface } from '@/interfaces/modifierToModifierGroupLink.interface';

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
  return { __esModule: true, ormConnection: jest.fn() };
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

const modifierToModifierGroupLinkModel = new ModifierToModifierGroupLinkModel();
describe('ModifierToModifierGroupLinkModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('deleteModifiersLinkedByModifierGroupID', () => {
    const MODIFIER_GROUP_ID = 123;
    it('should delete modifier(s) linked to modifier group', async () => {
      const deleteSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: deleteSpy,
      });
      await modifierToModifierGroupLinkModel.deleteModifiersLinkedByModifierGroupID(MODIFIER_GROUP_ID);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while deleting modifiers linked to modifier group', async () => {
      try {
        await modifierToModifierGroupLinkModel.deleteModifiersLinkedByModifierGroupID(MODIFIER_GROUP_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('insertModifierToModifierGroupLinks', () => {
    const MODIFIER_TO_MODIFIER_GROUP_LINKS: ModifierToModifierGroupLinkInterface[] = [
      {
        modifierGroupID: 1,
        modifierID: 2,
      },
      {
        modifierGroupID: 1,
        modifierID: 3,
      },
    ];
    it('should insert modifier(s) link with modifier group(s)', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });
      await modifierToModifierGroupLinkModel.insertModifierToModifierGroupLinks(MODIFIER_TO_MODIFIER_GROUP_LINKS);
      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while inserting modifier with modifier group', async () => {
      try {
        await modifierToModifierGroupLinkModel.insertModifierToModifierGroupLinks(MODIFIER_TO_MODIFIER_GROUP_LINKS);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
