import { TapManagerError } from '@/exceptions/HttpException';
import { ModifierToModifierGroupLinkInterface } from '@/interfaces/modifierToModifierGroupLink.interface';
import ModifierToModifierGroupLinkModel from '@/models/modifierToModifierGroupLink.model';
import ModifierToModifierGroupLinkService from '@/services/modifierToModifierGroupLink.service';
import { EntityManager } from 'typeorm';

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
jest.mock('@/models/modifierToModifierGroupLink.model', () => {
  const mockModifierToModfierGroupLink = {
    deleteModifiersLinkedByModifierGroupID: jest.fn(),
    insertModifierToModifierGroupLinks: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModifierToModfierGroupLink) };
});

const modifierToModifierGroupLinkModel = new ModifierToModifierGroupLinkModel();
const modifierToModifierGroupLinkService = new ModifierToModifierGroupLinkService(modifierToModifierGroupLinkModel);

describe('modifierToModifierGroupLinkService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('deleteModifiersLinkedByModifierGroupID', () => {
    const MODIFIER_GROUP_ID = 123;
    it('should successfully delete modifiers for modifier group', async () => {
      await modifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID(MODIFIER_GROUP_ID, {} as EntityManager);

      expect(modifierToModifierGroupLinkModel.deleteModifiersLinkedByModifierGroupID).toHaveBeenCalledWith(MODIFIER_GROUP_ID, {} as EntityManager);
    });
    it('should throw HttpException 500 if an error occurs while inserting modidier and modifier group', async () => {
      (modifierToModifierGroupLinkModel.deleteModifiersLinkedByModifierGroupID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID(MODIFIER_GROUP_ID, {} as EntityManager);
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
    it('should successfully insert modifier(s) with modifier group link', async () => {
      await modifierToModifierGroupLinkService.insertModifierToModifierGroupLinks(MODIFIER_TO_MODIFIER_GROUP_LINKS, {} as EntityManager);

      expect(modifierToModifierGroupLinkModel.insertModifierToModifierGroupLinks).toHaveBeenCalledWith(
        MODIFIER_TO_MODIFIER_GROUP_LINKS,
        {} as EntityManager,
      );
    });
    it('should throw HttpException 500 if an error occurs while inserting modidier and modifier group', async () => {
      (modifierToModifierGroupLinkModel.insertModifierToModifierGroupLinks as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierToModifierGroupLinkService.insertModifierToModifierGroupLinks(MODIFIER_TO_MODIFIER_GROUP_LINKS);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
