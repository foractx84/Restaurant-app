import { PackagePermissionEntity } from '@/entities/packagePermissions.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { PackagePermissionModelInterface, PackagePermissionServiceInterface } from '@/interfaces/packagePermission.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class PackagePermissionService implements PackagePermissionServiceInterface {
  private packagePermissionModel: PackagePermissionModelInterface;

  constructor(packagePermissionModel: PackagePermissionModelInterface) {
    this.packagePermissionModel = packagePermissionModel;
  }

  getPackagePermissionsByPackageID = async (packageID: number, repository?: EntityManager): Promise<PackagePermissionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return (await this.packagePermissionModel.getPackagePermissionsByPackageID(packageID, repository)) as PackagePermissionEntity[];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred when getting package permissions by packageID ${packageID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred when getting package permissions by packageID ${packageID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default PackagePermissionService;
