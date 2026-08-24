import MenuHoursService from '@services/menuHours.service';
import MenuHoursModel from '@/models/menuHours.model';
import { MenuHours, MenuHoursDBInterface } from '@interfaces/menuHours.interface';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { HttpException } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/models/menuHours.model', () => {
  const mockMenuHoursModel = {
    getMenuHoursEntityByMenuID: jest.fn(),
    insertAllMenuHours: jest.fn(),
    hardDeleteMenuHoursByMenuID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuHoursModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

// create mock menus model object
const mockMenuHoursModel = new MenuHoursModel();
const menuHoursService = new MenuHoursService(mockMenuHoursModel);

describe('menuHoursService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('insertMenuHours', () => {
    const MENU_ID = 1;
    it('should successfully create an array of MenuHours', async () => {
      // mock model response
      const mockModelResponse: MenuHoursDBInterface[] = [
        {
          id: 1191,
          day: 'Monday',
          start: '08:00',
          end: '20:00',
        },
        {
          id: 1192,
          day: 'Tuesday',
          start: '08:00',
          end: '20:00',
        },
        {
          id: 1193,
          day: 'Wednesday',
          start: '08:00',
          end: '20:00',
        },
        {
          id: 1194,
          day: 'Thursday',
          start: '08:00',
          end: '20:00',
        },
        {
          id: 1195,
          day: 'Friday',
          start: '08:00',
          end: '20:00',
        },
        {
          id: 1196,
          day: 'Saturday',
          start: '08:00',
          end: '20:00',
        },
        {
          id: 1197,
          day: 'Sunday',
          start: '08:00',
          end: '20:00',
        },
      ];

      // set up mock menus model to return our mock response to service
      (mockMenuHoursModel.insertAllMenuHours as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      // mock function params
      const mockMenuHours: MenuHours[] = [
        {
          day: 'Monday',
          start: '08:00',
          end: '20:00',
        },
        {
          day: 'Tuesday',
          start: '08:00',
          end: '20:00',
        },
      ];

      const result = await menuHoursService.insertMenuHours(mockMenuHours, MENU_ID, {} as PostgresQueriesRepository);
      // enforce test expectations
      expect(mockMenuHoursModel.insertAllMenuHours).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while inserting menu hours', async () => {
      (mockMenuHoursModel.insertAllMenuHours as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuHoursService.insertMenuHours([] as MenuHours[], MENU_ID, {} as PostgresQueriesRepository);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuHoursModel.insertAllMenuHours).toHaveBeenCalledTimes(1);
    });
  });
  describe('hardDeleteMenuHoursByMenuID', () => {
    const MENU_ID = 1;
    it('should successfully delete all menu hours of a menu with menu id', async () => {
      (mockMenuHoursModel.hardDeleteMenuHoursByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuHoursService.hardDeleteMenuHoursByMenuID(MENU_ID, {} as EntityManager);
      expect(mockMenuHoursModel.hardDeleteMenuHoursByMenuID).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu hours of a menu with menu id', async () => {
      (mockMenuHoursModel.hardDeleteMenuHoursByMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuHoursService.hardDeleteMenuHoursByMenuID(MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(mockMenuHoursModel.hardDeleteMenuHoursByMenuID).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMenuHoursByMenuID', () => {
    const MENU_ID = 1;
    it('should successfully get all menu hours of a menu with menu id', async () => {
      const expectedResponse = [
        {
          start: '09:00',
          end: '18:00',
          day: 'Saturday',
        },
        {
          start: '09:00',
          end: '18:00',
          day: 'Friday',
        },
      ];

      (mockMenuHoursModel.getMenuHoursEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(expectedResponse);

      await menuHoursService.getMenuHoursByMenuID(MENU_ID, {} as EntityManager);
      expect(mockMenuHoursModel.getMenuHoursEntityByMenuID).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while getting menu hours of a menu with menu id', async () => {
      (mockMenuHoursModel.getMenuHoursEntityByMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuHoursService.getMenuHoursByMenuID(MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
