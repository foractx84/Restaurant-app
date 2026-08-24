import { EntityManager } from 'typeorm';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';

export interface ManagerPackageServiceInterface {
  checkManagerHasAvailablePackage: (managerID: number, managerPackageID: number) => Promise<ManagerPackageEntity>;
  createManagerPackages: (managerPackages: ManagerPackageEntity[], repository?: EntityManager) => Promise<ManagerPackageEntity[]>;
  getUnassignedManagerPackagesByManagerIDAndPackageIDs: (
    managerID: number,
    packageIDs: number[],
    repository?: EntityManager,
  ) => Promise<ManagerPackageEntity[]>;
  updateManagerPackage: (managerPackageID: number, repository?: EntityManager) => Promise<void>;
}

export interface ManagerPackageModelInterface {
  assignManagerPackageByManagerPackageID: (managerPackageID: number, repository?: EntityManager) => Promise<void>;
  getAvailableManagerPackageByManagerIDAndManagerPackageID: (
    managerID: number,
    managerPackageID: number,
    repository?: EntityManager,
  ) => Promise<ManagerPackageEntity>;
  getUnassignedManagerPackagesByManagerIDAndPackageIDs: (
    managerID: number,
    packageIDs: number[],
    repository?: EntityManager,
  ) => Promise<ManagerPackageEntity[]>;
  insertManagerPackages: (managerPackages: ManagerPackageEntity[], repository?: EntityManager) => Promise<ManagerPackageEntity[]>;
}

export interface ManagerPackageDBInterface {
  manager_package_id?: number;
  external_user_id?: number;
  package_id: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  assigned_at?: string;
}
