import PackagePermissionModel from '@/models/packagePermission.model';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';

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

const packagePermissionModel = new PackagePermissionModel();

describe('PackagePermissionModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('getPackagePermissionsByPackageID', () => {
    const PACKAGE_ID = 1;
    it('should successfully get package permissions by package id', async () => {
      const find = jest.fn();

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      await packagePermissionModel.getPackagePermissionsByPackageID(PACKAGE_ID);

      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting package permissions by package id', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await packagePermissionModel.getPackagePermissionsByPackageID(PACKAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
