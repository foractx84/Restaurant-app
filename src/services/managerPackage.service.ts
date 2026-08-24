import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { ManagerPackageModelInterface, ManagerPackageServiceInterface } from '@interfaces/managerPackage.interface';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

class ManagerPackageService implements ManagerPackageServiceInterface {
  private managerPackageModel: ManagerPackageModelInterface;

  constructor(managerPackageModel: ManagerPackageModelInterface) {
    this.managerPackageModel = managerPackageModel;
  }

  createManagerPackages = async (managerPackages: ManagerPackageEntity[], repository?: EntityManager): Promise<ManagerPackageEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.managerPackageModel.insertManagerPackages(managerPackages, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating manager packages: ${JSON.stringify(managerPackages)}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating manager packages: ${JSON.stringify(managerPackages)}. Refer to logs for more info`,
          ),
        );
      }
    }
  };

  checkManagerHasAvailablePackage = async (managerID: number, managerPackageID: number): Promise<ManagerPackageEntity> => {
    try {
      const managerPackageEntity: ManagerPackageEntity = await this.managerPackageModel.getAvailableManagerPackageByManagerIDAndManagerPackageID(
        managerID,
        managerPackageID,
      );
      if (!managerPackageEntity) {
        logger.error(`Manager does not have available package managerPackageID ${managerPackageID} by managerID ${managerID}.`);
        throw new HttpException(
          404,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Manager does not have available package managerPackageID ${managerPackageID} by managerID ${managerID}.`,
          ),
        );
      }
      return managerPackageEntity;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred checking managerID ${managerID} has a package by managerPackageID ${managerPackageID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred checking managerID ${managerID} has a package by managerPackageID ${managerPackageID}.  Refer to logs for more info.`,
          ),
        );
      }
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
      return await this.managerPackageModel.getUnassignedManagerPackagesByManagerIDAndPackageIDs(managerID, packageIDs);
    } catch (err) {
      logger.error(
        `Error occurred getting unassigned manager packages by managerID ${managerID} and packageIDs ${JSON.stringify(managerID)} - ` + err,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred getting unassigned manager packages by managerID ${managerID} and packageIDs ${JSON.stringify(
            packageIDs,
          )}.  Refer to logs for more info.`,
        ),
      );
    }
  };

  updateManagerPackage = async (managerPackageID: number): Promise<void> => {
    try {
      await this.managerPackageModel.assignManagerPackageByManagerPackageID(managerPackageID);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred updating manager's package by managerPackageID ${managerPackageID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred updating manager's package by managerPackageID ${managerPackageID}.  Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default ManagerPackageService;
