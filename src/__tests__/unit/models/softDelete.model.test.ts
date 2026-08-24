import { ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import SoftDeleteModel from '@/models/softDelete.model';
import { EntityManager } from 'typeorm';

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

jest.mock('@/services/menuHours.service', () => {
  const mockMenuHoursService = {
    insertMenuHours: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuHoursService) };
});
jest.mock('@/services/menuSections.service', () => {
  const mockMenuSectionsService = {
    insertMenuSections: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuSectionsService) };
});

const mockSoftDeleteModel = new SoftDeleteModel();

describe('SoftDeleteModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('softDeleteMenuByID', () => {
    const mockMenuID = 1;
    it('should soft delete menu by menu id', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };

      await mockSoftDeleteModel.softDeleteMenuByID(mockMenuID, REPOSITORY as EntityManager);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu and throw http exception error', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };

      (updateSpy as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await mockSoftDeleteModel.softDeleteMenuByID(mockMenuID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('softDeleteMenuItemByMenuID', () => {
    const mockMenuID = 1;
    it('should soft delete menu item by menu id', async () => {
      const find = jest.fn();

      const mockFindMockMenuResponse = [
        {
          name: 'section 1',
          menu_id: 1,
          menu_section_id: 2,
        },
        {
          name: 'section 2',
          menu_id: 1,
          menu_section_id: 3,
        },
      ];

      (find as jest.MockedFunction<any>).mockResolvedValueOnce(mockFindMockMenuResponse);

      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };

      await mockSoftDeleteModel.softDeleteMenuItemByMenuSectionID(mockMenuID, REPOSITORY as EntityManager);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu item and throw http exception error', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };
      (find as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await mockSoftDeleteModel.softDeleteMenuByID(mockMenuID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('softDeleteMenuItemByMenuSectionID', () => {
    const mockMenuSectionID = 1;
    it('should soft delete menu item by menu section id', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };

      await mockSoftDeleteModel.softDeleteMenuItemByMenuSectionID(mockMenuSectionID, REPOSITORY as EntityManager);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu item and throw http exception error', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };
      (updateSpy as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await mockSoftDeleteModel.softDeleteMenuByID(mockMenuSectionID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('softDeleteMenuSectionByID', () => {
    const mockMenuSectionID = 1;
    it('should soft delete menu item by menu section id', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };

      await mockSoftDeleteModel.softDeleteMenuSectionByID(mockMenuSectionID, REPOSITORY as EntityManager);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu section and throw http exception error', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };
      (updateSpy as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await mockSoftDeleteModel.softDeleteMenuSectionByID(mockMenuSectionID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('softDeleteMenuSectionByMenuID', () => {
    const mockMenuID = 1;
    it('should soft delete menu item by menu section id', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };

      await mockSoftDeleteModel.softDeleteMenuSectionByMenuID(mockMenuID, REPOSITORY as EntityManager);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu section and throw http exception error', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };
      (updateSpy as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await mockSoftDeleteModel.softDeleteMenuSectionByID(mockMenuID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });
});
