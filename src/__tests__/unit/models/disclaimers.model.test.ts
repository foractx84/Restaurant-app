import MenuDisclaimerModel from '@/models/menuDisclaimers.model';
import { MenuDisclaimerDBInterface } from '@/interfaces/disclaimers.interface';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { HttpException } from '@/exceptions/HttpException';
import { EntityManager } from 'typeorm';
import { MenuDisclaimerTypeEntity } from '@/entities/disclaimerType.entity';
import { ormConnection } from '@/utils/dbUtils';
import { MenuDisclaimer } from '@/enums/menuDisclaimer';

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
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

// create mock disclaimers model object
const mockDisclaimerModel = new MenuDisclaimerModel();

describe('MenuDisclaimersModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('getMenuDisclaimerType', () => {
    const mockMenuDisclaimerTypeResponse: MenuDisclaimerTypeEntity = {
      message_type_id: 1,
      name: MenuDisclaimer.top,
    };
    const POSITION = MenuDisclaimer.top;
    it('should successfully get menu disclaimer type', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerTypeResponse);

      // call on the service like the controller would
      const result = await mockDisclaimerModel.getMenuDisclaimerType(POSITION);
      // enforce test expectations
      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMenuDisclaimerTypeResponse);
    });
    it('should throw a HttpException if any error occurs while getting menu disclaimer type', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockDisclaimerModel.getMenuDisclaimerType(POSITION);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });

  describe('insertMenuDisclaimers', () => {
    const mockMenuDisclaimerResponse: MenuDisclaimerDBInterface[] = [
      {
        menu_id: 1,
        message_id: 1,
        message_type_id: 1,
        message: 'TEST menu message',
      },
    ];
    it('should successfully create menu disclaimers', async () => {
      const menuDisclaimersEntityArray = [
        {
          menu_id: 1,
          message_id: 1,
          message_type_id: 1,
          message: 'TEST menu message',
        },
      ];

      const insert = jest.fn().mockResolvedValue({ raw: mockMenuDisclaimerResponse });
      const REPOSITORY: any = {
        insert,
      };

      // call on the service like the controller would
      const result = await mockDisclaimerModel.insertMenuDisclaimers(menuDisclaimersEntityArray, REPOSITORY as PostgresQueriesRepository);
      // enforce test expectations
      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMenuDisclaimerResponse);
    });
  });

  describe('updateMenuDisclaimers', () => {
    const MENU_ID = 275;
    const mockMenuDisclaimers = [
      {
        message_id: 1,
        message: 'update top',
        message_type_id: 1,
        menu_id: MENU_ID,
      },
      {
        message_id: 2,
        message: 'update bottom',
        message_type_id: 2,
        menu_id: MENU_ID,
      },
    ];
    it('should successfully update menu disclaimers', async () => {
      const save = jest.fn();
      const REPOSITORY: any = {
        save,
      };
      (save as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await mockDisclaimerModel.updateMenuDisclaimers(mockMenuDisclaimers, REPOSITORY as EntityManager);

      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating menu disclaimers', async () => {
      const save = jest.fn();
      const REPOSITORY: any = {
        save,
      };
      (save as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockDisclaimerModel.updateMenuDisclaimers(mockMenuDisclaimers, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });

  describe('deleteMenuDisclaimers', () => {
    const DISCLAIMER_IDS = [1, 2, 3];
    const MENU_ID = 1;
    it('should successfully delete menu disclaimer message', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };

      await mockDisclaimerModel.deleteMenuDisclaimers(DISCLAIMER_IDS, MENU_ID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu disclaimer', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };
      (deleteSpy as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockDisclaimerModel.deleteMenuDisclaimers(DISCLAIMER_IDS, MENU_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getAllMenuDisclaimersEntityByMenuID', () => {
    const MENU_ID = 1;
    it('should successfully get all menu disclaimers via menuID', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID(MENU_ID, REPOSITORY as EntityManager);

      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 error if any occurs while getting menu disclaimers via menuID', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };
      (find as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID(MENU_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
