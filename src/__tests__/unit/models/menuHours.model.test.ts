import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import MenuHoursModel from '@/models/menuHours.model';
import { MenuHoursDBInterface } from '@interfaces/menuHours.interface';
import { MenuHoursEntity } from '@/entities/menuHours.entity';
import { EntityManager } from 'typeorm';
import { HttpException } from '@/exceptions/HttpException';
import { ormConnection } from '@/utils/dbUtils';

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

const menuHoursModel = new MenuHoursModel();
describe('menuHoursModel', () => {
  describe('insertAllMenuHours', () => {
    const MENU_ID = 1035;
    const MENU_HOURS: MenuHoursEntity[] = [
      new MenuHoursEntity(MENU_ID, 'Monday', '08:00', '20:00'),
      new MenuHoursEntity(MENU_ID, 'Tuesday', '08:00', '20:00'),
    ];
    it('should insert menu hours successfully', async () => {
      const expectedResponse: MenuHoursDBInterface[] = [
        {
          id: 1191,
          menu_id: 1035,
          day: 'Monday',
          start: '08:00',
          end: '20:00',
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
        },
        {
          id: 1192,
          menu_id: 1035,
          day: 'Tuesday',
          start: '08:00',
          end: '20:00',
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
        },
      ];

      const insert = jest.fn().mockResolvedValue({ raw: expectedResponse });
      const REPOSITORY: any = {
        insert,
      };
      const result = await menuHoursModel.insertAllMenuHours(MENU_HOURS, REPOSITORY as PostgresQueriesRepository);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
  });
  describe('hardDeleteMenuHoursByMenuID', () => {
    const MENU_ID = 1;
    it('should successfully delete menu hours of a menu by menu id', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };
      (deleteSpy as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuHoursModel.hardDeleteMenuHoursByMenuID(MENU_ID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu hours of a menu by menu id', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };
      (deleteSpy as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuHoursModel.hardDeleteMenuHoursByMenuID(MENU_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenuHoursEntityByMenuID', () => {
    const MENU_ID = 1;
    it('should successfully get menu hours entity of a menu by menu id', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuHoursModel.getMenuHoursEntityByMenuID(MENU_ID);

      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting menu hours of a menu by menu id', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };
      (find as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuHoursModel.getMenuHoursEntityByMenuID(MENU_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
