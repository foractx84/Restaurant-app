import { TapManagerError } from '@exceptions/HttpException';
import ManagerPackageService from '@services/managerPackage.service';
import ManagerPackageModel from '@/models/managerPackage.model';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';
import { EntityManager } from 'typeorm';

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
jest.mock('@/models/managerPackage.model', () => {
  const mockManagerPackageModel = {
    assignManagerPackageByManagerPackageID: jest.fn(),
    getAvailableManagerPackageByManagerIDAndManagerPackageID: jest.fn(),
    getUnassignedManagerPackagesByManagerIDAndPackageIDs: jest.fn(),
    insertManagerPackages: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerPackageModel) };
});

const mockManagerPackageModel = new ManagerPackageModel();
const managerPackageService = new ManagerPackageService(mockManagerPackageModel);

describe('managerPackageService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('checkManagerHasAvailablePackage', () => {
    const MANAGER_ID = 2;
    const PACKAGE_ID = 3;
    const MANAGER_PACKAGE_ID = 4;
    const mockManagerPackageEntity: ManagerPackageEntity = {
      external_user_id: MANAGER_ID,
      package_id: PACKAGE_ID,
      manager_package_id: MANAGER_PACKAGE_ID,
    };
    it('should successfully check manager has available package', async () => {
      (mockManagerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockManagerPackageEntity,
      );

      const result = await managerPackageService.checkManagerHasAvailablePackage(MANAGER_ID, MANAGER_PACKAGE_ID);

      expect(mockManagerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID).toHaveBeenCalledWith(MANAGER_ID, MANAGER_PACKAGE_ID);
      expect(result).toEqual(mockManagerPackageEntity);
    });
    it('should throw 404 HttpException error occurs if manager does not have available package', async () => {
      (mockManagerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await managerPackageService.checkManagerHasAvailablePackage(MANAGER_ID, MANAGER_PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID).toHaveBeenCalledWith(MANAGER_ID, MANAGER_PACKAGE_ID);
    });
    it('should throw 500 Bad Request HttpException if any error exists while checking manager has available package', async () => {
      (mockManagerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managerPackageService.checkManagerHasAvailablePackage(MANAGER_ID, MANAGER_PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID).toHaveBeenCalledWith(MANAGER_ID, MANAGER_PACKAGE_ID);
    });
  });
  describe('createManagerPackages', () => {
    const MANAGER_PACKAGES: ManagerPackageEntity[] = [
      {
        external_user_id: 1,
        package_id: 2,
      },
    ];
    it('should successfully create manager packages', async () => {
      await managerPackageService.createManagerPackages(MANAGER_PACKAGES);

      expect(mockManagerPackageModel.insertManagerPackages).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while creating managaer packages', async () => {
      (mockManagerPackageModel.insertManagerPackages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managerPackageService.createManagerPackages(MANAGER_PACKAGES);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
      expect(mockManagerPackageModel.insertManagerPackages).toHaveBeenCalled();
    });
  });
  describe('updateManagerPackage', () => {
    const MANAGER_PACKAGE_ID = 4;
    it('should successfully update manager package', async () => {
      await managerPackageService.updateManagerPackage(MANAGER_PACKAGE_ID);

      expect(mockManagerPackageModel.assignManagerPackageByManagerPackageID).toHaveBeenCalledWith(MANAGER_PACKAGE_ID);
    });
    it('should throw 500 Bad Request HttpException if any error exists while updating manager package', async () => {
      (mockManagerPackageModel.assignManagerPackageByManagerPackageID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managerPackageService.updateManagerPackage(MANAGER_PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagerPackageModel.assignManagerPackageByManagerPackageID).toHaveBeenCalledWith(MANAGER_PACKAGE_ID);
    });
  });
  describe('getUnassignedManagerPackagesByManagerIDAndPackageIDs', () => {
    const MANAGER_ID = 1;
    const PACKAGE_IDs = [1];
    const mockManagerPackageEntites: ManagerPackageEntity[] = [
      {
        manager_package_id: 1,
        package_id: 1,
        external_user_id: 1,
      },
    ];
    it('should successfully get manager package(s) based on managerID and packageIDs', async () => {
      (mockManagerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockManagerPackageEntites,
      );

      const result = await managerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs(MANAGER_ID, PACKAGE_IDs, {} as EntityManager);

      expect(mockManagerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs).toHaveBeenCalledWith(MANAGER_ID, PACKAGE_IDs);
      expect(result).toEqual(mockManagerPackageEntites);
    });
    it('should throw 500 Bad Request HttpException if any error exists while updating manager package', async () => {
      (mockManagerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managerPackageService.getUnassignedManagerPackagesByManagerIDAndPackageIDs(MANAGER_ID, PACKAGE_IDs, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs).toHaveBeenCalledWith(MANAGER_ID, PACKAGE_IDs);
    });
  });
});
