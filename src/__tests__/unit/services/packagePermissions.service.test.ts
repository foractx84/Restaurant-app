import { HttpException } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import PackagePermissionModel from '@/models/packagePermission.model';
import PackagePermissionService from '@/services/packagePermission.service';
import { PackagePermissionDBInterface } from '@/interfaces/packagePermission.interface';
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
jest.mock('@/models/packagePermission.model', () => {
  const mockPackagePermissionsModel = {
    getPackagePermissionsByPackageID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockPackagePermissionsModel) };
});

// create mock menu sections model object
const mockPackagePermissionModel = new PackagePermissionModel();
const mockPackagePermissionService = new PackagePermissionService(mockPackagePermissionModel);

describe('PackagePermissionService', () => {
  afterEach(() => {
    jest.resetAllMocks();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('getPackagePermissionsByPackageID', () => {
    const PACKAGE_ID = 1;
    it('should successfully get package permissions by packageID', async () => {
      // mock model response
      const mockModelResponse: PackagePermissionDBInterface[] = [
        {
          package_permission_id: 1,
          permission_id: 1,
          created_at: '2022-01-01T00:00:00',
          updated_at: '2022-01-01T00:00:00',
          deleted_at: null,
        },
      ];

      // set up mock menus model to return our mock response to service
      (mockPackagePermissionModel.getPackagePermissionsByPackageID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);
      // mock function params

      const result = await mockPackagePermissionService.getPackagePermissionsByPackageID(PACKAGE_ID, {} as EntityManager);
      // enforce test expectations
      expect(mockPackagePermissionModel.getPackagePermissionsByPackageID).toHaveBeenCalledWith(PACKAGE_ID, {} as EntityManager);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while getting package permissions by package id', async () => {
      (mockPackagePermissionModel.getPackagePermissionsByPackageID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockPackagePermissionService.getPackagePermissionsByPackageID(PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockPackagePermissionModel.getPackagePermissionsByPackageID).toHaveBeenCalledTimes(1);
    });
  });
});
