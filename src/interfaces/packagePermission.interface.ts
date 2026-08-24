import { PackagePermissionEntity } from '@/entities/packagePermissions.entity';
import { EntityManager } from 'typeorm';

export interface PackagePermissionServiceInterface {
  getPackagePermissionsByPackageID: (packageID: number, repository?: EntityManager) => Promise<PackagePermissionEntity[]>;
}

export interface PackagePermissionModelInterface {
  getPackagePermissionsByPackageID: (packageID: number, repository?: EntityManager) => Promise<PackagePermissionEntity[]>;
}

export interface PackagePermissionDBInterface {
  package_permission_id: number;
  package_id?: number;
  permission_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}
