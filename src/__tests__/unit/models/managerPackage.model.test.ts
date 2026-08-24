import { TapManagerError } from '@exceptions/HttpException';
import ManagerPackageModel from '@/models/managerPackage.model';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
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

const managerPackageModel = new ManagerPackageModel();
describe('managerPackageModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('assignManagerPackageByManagerPackageID', () => {
    const MANAGER_PACKAGE_ID = 2;
    it('should successfully update manager package', async () => {
      const update = jest.fn();
      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      await managerPackageModel.assignManagerPackageByManagerPackageID(MANAGER_PACKAGE_ID, REPOSITORY as EntityManager);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating manager package', async () => {
      const update = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        update,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await managerPackageModel.assignManagerPackageByManagerPackageID(MANAGER_PACKAGE_ID, REPOSITORY as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(update).toHaveBeenCalledTimes(1);
    });
  });
  describe('getAvailableManagerPackageByManagerIDAndManagerPackageID', () => {
    const MANAGER_ID = 2;
    const MANAGER_PACKAGE_ID = 1;
    it('should successfully get available package of manager', async () => {
      const findOne = jest.fn();

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await managerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID(MANAGER_ID, MANAGER_PACKAGE_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting available manager package', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await managerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID(MANAGER_ID, MANAGER_PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertManagerPackages', () => {
    const managerPackageEntity: ManagerPackageEntity = {
      manager_package_id: 1,
      external_user_id: 1,
      package_id: 1,
    };
    it('should insert manager packages successfully', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: [managerPackageEntity] });
      const CUSTOM_REPO: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPO,
      };

      const result = await managerPackageModel.insertManagerPackages([managerPackageEntity], REPOSITORY as EntityManager);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(managerPackageEntity);
    });
    it('should throw HttpException 500 if an error occurs while inserting manager package', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await managerPackageModel.insertManagerPackages([managerPackageEntity], REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getUnassignedManagerPackagesByManagerIDAndPackageIDs', () => {
    const MANAGER_ID = 1;
    const PACKAGE_IDs = [1];
    it('should get manager packages successfully', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };

      await managerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs(MANAGER_ID, PACKAGE_IDs, REPOSITORY);

      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while getting manager package', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        find,
      };

      try {
        await managerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs(MANAGER_ID, PACKAGE_IDs, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(find).toHaveBeenCalledTimes(1);
    });
  });
});
