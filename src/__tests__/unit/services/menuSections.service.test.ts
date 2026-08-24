import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { HttpException } from '@exceptions/HttpException';
import MenuSectionsModel from '@/models/menuSections.model';
import MenuSectionsService from '@services/menuSections.service';
import { MenuSectionNameAndMessageInterface, MenuSectionsDBInterface } from '@interfaces/menuSections.interface';
import { CreateMenuSectionsInterface } from '@interfaces/menuSections.interface';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { ormConnection } from '@utils/dbUtils';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
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
jest.mock('@/models/menuSections.model', () => {
  const mockMenuSectionsModel = {
    findMenuSectionEntityByID: jest.fn(),
    deleteMenuSection: jest.fn(),
    getMenuSectionsByMenuID: jest.fn(),
    getMenuSectionEntityByID: jest.fn(),
    hideMenuSection: jest.fn(),
    insertMenuSections: jest.fn(),
    insertAllMenuSections: jest.fn(),
    updateMenuSectionName: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuSectionsModel) };
});

// create mock menu sections model object
const mockMenuSectionsModel = new MenuSectionsModel();
const menuSectionsService = new MenuSectionsService(mockMenuSectionsModel);

describe('menuSectionsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertMenuSections', () => {
    const MENU_ID = 1;
    it('should successfully create an array of MenuSections', async () => {
      // mock model response
      const mockModelResponse: MenuSectionsDBInterface[] = [
        {
          menu_section_id: 1068,
          name: 'test menu section',
          menu_id: 1035,
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
          list_order: 0,
        },
        {
          menu_section_id: 1069,
          name: 'test menu section 2',
          menu_id: 1035,
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
          list_order: 1,
        },
      ];

      // set up mock menus model to return our mock response to service
      (mockMenuSectionsModel.insertAllMenuSections as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      // mock function params
      const mockMenuSections: MenuSectionNameAndMessageInterface[] = [
        {
          name: 'test menu section',
          message: 'test message',
        },
        {
          name: 'test menu section 2',
        },
      ];

      const result = await menuSectionsService.insertMenuSections(mockMenuSections, MENU_ID, {} as PostgresQueriesRepository);
      // enforce test expectations
      expect(mockMenuSectionsModel.insertAllMenuSections).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while inserting menu sections', async () => {
      (mockMenuSectionsModel.insertAllMenuSections as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.insertMenuSections([] as MenuSectionNameAndMessageInterface[], MENU_ID, {} as PostgresQueriesRepository);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuSectionsModel.insertAllMenuSections).toHaveBeenCalledTimes(1);
    });
  });
  describe('createMenuSections', () => {
    const MENU_ID = 1;
    it('should successfully create menu sections', async () => {
      // mock model response
      const mockInsertAllMenuSections = [
        { menu_id: 1, menu_section_id: 2, name: 'test menu section 2' },
        { menu_id: 1, menu_section_id: 3, name: 'test menu section', message: 'test message' },
      ];
      const mockCreateMenuSectionResponse: CreateMenuSectionsInterface = {
        menuID: 1,
        menuSections: [
          { menuSectionID: 2, name: 'test menu section 2', message: '' },
          { menuSectionID: 3, name: 'test menu section', message: 'test message' },
        ],
      };

      (mockMenuSectionsModel.insertMenuSections as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertAllMenuSections);

      // mock function params
      const mockMenuSections: MenuSectionNameAndMessageInterface[] = [
        {
          name: 'test menu section',
          message: 'test message',
        },
        {
          name: 'test menu section 2',
        },
      ];

      const result = await menuSectionsService.createMenuSections(mockMenuSections, MENU_ID);
      // enforce test expectations
      expect(mockMenuSectionsModel.insertMenuSections).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCreateMenuSectionResponse);
    });
    it('should throw a HttpException if any error occurs while inserting menu sections', async () => {
      (mockMenuSectionsModel.insertAllMenuSections as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.createMenuSections([] as MenuSectionNameAndMessageInterface[], MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException if a menu section(s) name already exists', async () => {
      const mockMenuSections: MenuSectionNameAndMessageInterface[] = [
        {
          name: 'test menu section',
          message: 'test message',
        },
        {
          name: 'test menu section 2',
        },
      ];
      await expect(menuSectionsService.createMenuSections(mockMenuSections, MENU_ID)).rejects.toThrow(HttpException);
    });
  });
  describe('getMenuSectionEntityByID', () => {
    const MENU_SECTION_ID = 1;
    it('should successfully get menu section by id', async () => {
      // mock model response
      const menuSectionEntity: MenuSectionEntity = {
        menu_section_id: MENU_SECTION_ID,
        name: 'test menu section',
        menu_id: 1035,
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        list_order: 0,
        deleted: false,
        message: '',
        is_hidden: false,
      };

      (mockMenuSectionsModel.findMenuSectionEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(menuSectionEntity);

      const result = await menuSectionsService.getMenuSectionEntityByID(MENU_SECTION_ID);
      // enforce test expectations
      expect(mockMenuSectionsModel.findMenuSectionEntityByID).toHaveBeenCalledWith(MENU_SECTION_ID);
      expect(result).toEqual(menuSectionEntity);
    });
    it('should throw a HttpException if any error occurs while getting menu section by id', async () => {
      (mockMenuSectionsModel.findMenuSectionEntityByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.getMenuSectionEntityByID(MENU_SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(mockMenuSectionsModel.findMenuSectionEntityByID).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuSection', () => {
    const MENU_SECTION_ID = 1;
    it('should successfully delete menu section by menu section id', async () => {
      (mockMenuSectionsModel.deleteMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce();

      await menuSectionsService.deleteMenuSection(MENU_SECTION_ID);
      expect(mockMenuSectionsModel.deleteMenuSection).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting menu section by id', async () => {
      (mockMenuSectionsModel.deleteMenuSection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.deleteMenuSection(MENU_SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(mockMenuSectionsModel.deleteMenuSection).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMenuSectionsForMenuDetails', () => {
    const MENU_ID = 1;
    it('should successfully get menu sections by menu id', async () => {
      const mockMenuSectionData = [
        {
          menu_section_id: 4,
          section_name: 'Pasta',
          message: 'test_message',
        },
      ];
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuSectionData);

      await menuSectionsService.getMenuSectionsForMenuDetails(MENU_ID);
      expect(mockMenuSectionsModel.getMenuSectionsByMenuID).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while getting menu sections by menu id', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.getMenuSectionsForMenuDetails(MENU_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('reorder', () => {
    const MENU_ID = 275;
    const correctMenuSectionsOrder = [4, 1, 3, 2];
    const wrongValuesMenuSectionsOrder = [4, 1, 3, 5];
    const missingValuesMenuSectionsOrder = [4, 3, 4];
    const extraValuesMenuSectionsOrder = [4, 1, 3, 5, 2];
    const duplicateValuesMenuSectionsOrder = [4, 1, 3, 3, 2];
    const mockExistingMenuSections = [
      {
        menu_section_id: 1,
        section_name: 'Pasta',
      },
      {
        menu_section_id: 2,
        section_name: 'Pizza',
      },
      {
        menu_section_id: 3,
        section_name: 'Entrees',
      },
      {
        menu_section_id: 4,
        section_name: 'Appetizers',
      },
    ];
    it('should successfully reorder menu sections by menuID and menuSectionsOrder by calling transaction', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuSections);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuSectionsService.reorderMenuSections(MENU_ID, correctMenuSectionsOrder);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while reordering menu sections of a menu', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.reorderMenuSections(MENU_ID, correctMenuSectionsOrder);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menu sections in request body have less than exist in menu', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuSections);

      try {
        await menuSectionsService.reorderMenuSections(MENU_ID, missingValuesMenuSectionsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menu sections in request body have extra menu sections than exist in menu', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuSections);

      try {
        await menuSectionsService.reorderMenuSections(MENU_ID, extraValuesMenuSectionsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if duplicate menu sections', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuSections);

      try {
        await menuSectionsService.reorderMenuSections(MENU_ID, duplicateValuesMenuSectionsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menu sections in body request dont match with menu sections of a menu', async () => {
      (mockMenuSectionsModel.getMenuSectionsByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuSections);

      try {
        await menuSectionsService.reorderMenuSections(MENU_ID, wrongValuesMenuSectionsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
      }
    });
  });
  describe('editMenuSections', () => {
    const MENU_ID = 275;
    it('should successfully edit menu section when same menu section already exists with same name', async () => {
      // menu section to edit
      const menuSection = {
        menuID: MENU_ID,
        menuSectionID: 1,
        menuSectionName: 'EDIT Test Name',
      };
      const { menuID, menuSectionID, menuSectionName } = menuSection;

      (mockMenuSectionsModel.updateMenuSectionName as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuSectionsService.editMenuSection(menuID, menuSectionID, menuSectionName);
      // enforce test expectations
      expect(mockMenuSectionsModel.updateMenuSectionName).toHaveBeenCalledTimes(1);
    });
    it('should successfully edit menu section when no menu section in database exists with same name', async () => {
      // menu section to edit
      const menuSection = {
        menuID: MENU_ID,
        menuSectionID: 1,
        menuSectionName: 'EDIT Test Name',
      };
      const { menuID, menuSectionID, menuSectionName } = menuSection;

      (mockMenuSectionsModel.updateMenuSectionName as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuSectionsService.editMenuSection(menuID, menuSectionID, menuSectionName);
      // enforce test expectations
      expect(mockMenuSectionsModel.updateMenuSectionName).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while editing menu sections', async () => {
      const menuSection = {
        menuID: MENU_ID,
        menuSectionID: 1,
        menuSectionName: 'EDIT Test Name',
      };
      const { menuID, menuSectionID, menuSectionName } = menuSection;

      (mockMenuSectionsModel.updateMenuSectionName as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.editMenuSection(menuID, menuSectionID, menuSectionName);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException if a menu section(s) name already exists of another menu section in same menu', async () => {
      const menuSection = {
        menuID: MENU_ID,
        menuSectionID: 2,
        menuSectionName: 'EDIT Test Name',
      };
      const { menuID, menuSectionID, menuSectionName } = menuSection;

      try {
        await menuSectionsService.editMenuSection(menuID, menuSectionID, menuSectionName);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('hideMenuSection', () => {
    const MENU_SECTION_ID = 1;
    const HIDE = true;
    it('should successfully hide menu section by menuSectionID', async () => {
      (mockMenuSectionsModel.hideMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuSectionsService.hideMenuSection(MENU_SECTION_ID, HIDE);
      expect(mockMenuSectionsModel.hideMenuSection).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while hiding menu section', async () => {
      (mockMenuSectionsModel.hideMenuSection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuSectionsService.hideMenuSection(MENU_SECTION_ID, HIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
