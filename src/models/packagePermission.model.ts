import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager, IsNull } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { PackagePermissionEntity } from '@entities/packagePermissions.entity';
import { PackagePermissionModelInterface } from '@interfaces/packagePermission.interface';

class PackagePermissionModel implements PackagePermissionModelInterface {
  getPackagePermissionsByPackageID = async (packageID: number, repository?: EntityManager): Promise<PackagePermissionEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return repository.find(PackagePermissionEntity, {
        where: { package_id: packageID, deleted_at: IsNull() },
        relations: ['permission_id'],
      });
    } catch (err) {
      logger.error(`Error with getting package permissions with packageID '${packageID}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with getting package permissions with packageID '${packageID}`),
      );
    }
  };
}

export default PackagePermissionModel;
