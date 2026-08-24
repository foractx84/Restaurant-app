import { EntityManager, In, IsNull } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { ManagerPackageModelInterface } from '@interfaces/managerPackage.interface';
import { ManagerPackageEntity } from '@entities/managerPackage.entity';
import { getCurrentDate } from '@utils/timeUtils';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class ManagerPackageModel implements ManagerPackageModelInterface {
  assignManagerPackageByManagerPackageID = async (managerPackageID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(ManagerPackageEntity, managerPackageID, { assigned_at: getCurrentDate() });
    } catch (err) {
      logger.error(`Error occurred while updating managerPackageID ${managerPackageID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating managerPackageID ${managerPackageID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getAvailableManagerPackageByManagerIDAndManagerPackageID = async (
    managerID: number,
    managerPackageID: number,
    repository?: EntityManager,
  ): Promise<ManagerPackageEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(ManagerPackageEntity, {
        where: { external_user_id: managerID, manager_package_id: managerPackageID, assigned_at: IsNull(), deleted_at: IsNull() },
        relations: ['external_user_id'],
      });
    } catch (err) {
      logger.error(`Error occurred while getting managerPackageID ${managerPackageID} with managerID ${managerID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting managerPackageID ${managerPackageID} with managerID ${managerID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getUnassignedManagerPackagesByManagerIDAndPackageIDs = async (
    managerID: number,
    packageIDs: number[],
    repository?: EntityManager,
  ): Promise<ManagerPackageEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(ManagerPackageEntity, {
        external_user_id: managerID,
        package_id: In(packageIDs),
        assigned_at: IsNull(),
        deleted_at: IsNull(),
      });
    } catch (err) {
      logger.error(`Error occurred while getting managerPackages by managerID ${managerID} and packageIDs ${JSON.stringify(packageIDs)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting managerPackages by managerID ${managerID} and packageIDs ${JSON.stringify(
            packageIDs,
          )}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertManagerPackages = async (managerPackages: ManagerPackageEntity[], repository?: EntityManager): Promise<ManagerPackageEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const menuItemResult = await customRepository.insert('manager_packages', managerPackages);
      const databaseResult = classToPlain(menuItemResult.raw[0]);
      return databaseResult as ManagerPackageEntity[];
    } catch (err) {
      logger.error(`Error occurred while inserting manager packages: ${JSON.stringify(managerPackages)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting manager packages: ${JSON.stringify(managerPackages)}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default ManagerPackageModel;
