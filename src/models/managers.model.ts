import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import {
  CreateManagerToRestaurantLinkInterface,
  ManagersModelsInterface,
  CreateManagerInterface,
  CreateManagerDBInterface,
} from '@interfaces/managers.interface';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { ManagerEntity } from '@entities/manager.entity';
import { EntityManager, ILike } from 'typeorm';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class ManagersModel implements ManagersModelsInterface {
  getManagerEntityByEmail = async (email: string, repository?: EntityManager): Promise<ManagerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(ManagerEntity, { email: ILike(`${email}`) });
    } catch (err) {
      logger.error(`Error with getting manager by email ${err}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with getting manager by email '${email}`));
    }
  };

  createManager = async (manager: CreateManagerInterface, repository?: EntityManager): Promise<CreateManagerDBInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const databaseResult = await customRepository.insert('manager_external_users', [
        {
          first_name: manager.firstName,
          last_name: manager.lastName,
          email: manager.email.toLowerCase(),
          phone: manager.phone,
          pwd: manager.pwd,
          position_title_id: manager.titleID,
        },
      ]);
      return { id: databaseResult.raw[0].id };
    } catch (err) {
      logger.error(`Create Manager Error - ` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating a manager'));
    }
  };

  createManagerEntity = async (manager: ManagerEntity, repository?: EntityManager): Promise<ManagerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const databaseResult = await customRepository.insert('manager_external_users', [manager]);
      return classToPlain(databaseResult.raw[0]) as ManagerEntity;
    } catch (err) {
      logger.warn(`Create Manager Error - ` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating a manager'));
    }
  };

  createManagerToRestaurantLink = async (manager: CreateManagerToRestaurantLinkInterface, repository?: EntityManager): Promise<void> => {
    const externalUserID = manager.externalUserID;
    const restaurantID = manager.restaurantID;
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      await customRepository.insert('manager_restaurants', [{ external_user_id: externalUserID, restaurant_id: restaurantID }]);
    } catch (err) {
      logger.error(`Create Manager To Restaurant Link Error for externalUserID: ${externalUserID} and restaurantID: ${restaurantID} - ` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating a manager to restaurant link'));
    }
  };

  getManagerAndTitleByID = async (managerID: number, repository?: EntityManager): Promise<ManagerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(ManagerEntity, managerID, { relations: ['position_title_id'] });
    } catch (err) {
      logger.error(`Error with getting manager and title by id ${managerID}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with getting manager and title by id '${managerID}`));
    }
  };

  getManagerEntityByID = async (managerID: number, repository?: EntityManager): Promise<ManagerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(ManagerEntity, { id: managerID });
    } catch (err) {
      logger.error(`Error with getting manager by id ${managerID}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with getting manager by id '${managerID}`));
    }
  };

  getManagerByStripeCustomerIDOrEmail = async (stripeCustomerID: string, email: string, repository?: EntityManager): Promise<ManagerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(ManagerEntity, {
        where: [{ stripe_customer_id: stripeCustomerID }, { email: ILike(`${email}`) }],
      });
    } catch (err) {
      logger.error(`Error occurred while getting manager by email and stripe customer id: ${stripeCustomerID} - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting manager by email and stripe customer id: ${stripeCustomerID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  setVerifiedAtAndResetEmailCode = async (managerID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(ManagerEntity, managerID, { verified_at: new Date() as unknown as string, email_code: null });
    } catch (err) {
      logger.error(`Error updating user to verified and clearing email code for manager ${managerID}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error updating user to verified and clearing email code ${managerID}`),
      );
    }
  };

  updateManagerEmailCode = async (managerID: number, hashedEmailCode: string, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(ManagerEntity, managerID, { email_code: hashedEmailCode });
    } catch (err) {
      logger.error(`Error occurred while updating user's email code via manager id ${managerID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating user's email code via manager id ${managerID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  updateManagerPasswordByID = async (managerID: number, password: string, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(ManagerEntity, managerID, { pwd: password });
    } catch (err) {
      // if error has already been typed and taken care of
      logger.error(`Error occurred while updating user's password via manager id ${managerID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating user's password via manager id ${managerID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  updateManagerInfoByID = async (managerInfo: ManagerEntity, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      if (managerInfo.email) {
        managerInfo.email = managerInfo.email.toLowerCase();
      }
      await repository.save(ManagerEntity, managerInfo);
    } catch (err) {
      logger.error(`Error updating manager with id: '${managerInfo.id}' - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error updating manager with id '${managerInfo.id}'. Refer to logs for more info.`),
      );
    }
  };
}

export default ManagersModel;
