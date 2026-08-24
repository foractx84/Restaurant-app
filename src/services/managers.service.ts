import {
  ManagersServiceInterface,
  ManagersModelsInterface,
  CreateManagerInterface,
  CreateManagerToRestaurantLinkInterface,
  ManagerDBInterface,
  GetManagerInterface,
  ManagerEditInfoRequestInterface,
} from '@interfaces/managers.interface';
import { sendEmailOnboarding, sendResetPasswordEmail } from '@utils/emailUtils';
import { passwordIsValid } from '@/utils/passwordUtils';
import { toTitleCase, generateRandomPassword } from '@utils/util';
import { getCurrentDate } from '@utils/timeUtils';
import { HttpException, getErrorPayload, InternalErrorCode } from '@exceptions/HttpException';
import TitlesModel from '@/models/titles.model';
import { RestaurantsServiceInterface } from '@/interfaces/restaurants.interface';
import { generatePasswordHash } from '@/services/auth.service';
import { logger } from '@/utils/logger';
import { ManagerEntity } from '@/entities/manager.entity';
import bcrypt from 'bcrypt';
import { TokenDataInterface } from '@/interfaces/auth.interface';
import { ormConnection } from '@/utils/dbUtils';
import { EntityManager } from 'typeorm';
import { generateToken } from '@/utils/generateToken';
import { STRIPE } from '@/configs/config';
import Stripe from 'stripe';
import { StripeRawErrorType } from '@/exceptions/StripeException';

const stripe = new Stripe(STRIPE.STRIPE_API_KEY, {
  apiVersion: '2022-08-01',
  typescript: true,
});

class ManagersService implements ManagersServiceInterface {
  private managersModel: ManagersModelsInterface;
  private titlesModel: TitlesModel;
  private restaurantService: RestaurantsServiceInterface;

  constructor(managersModel: ManagersModelsInterface, titlesModel: TitlesModel, restaurantService: RestaurantsServiceInterface) {
    this.managersModel = managersModel;
    this.titlesModel = titlesModel;
    this.restaurantService = restaurantService;
  }

  createManager = async (manager: CreateManagerInterface): Promise<void> => {
    try {
      const verifiedRestaurants = await this.restaurantService.verifyRestaurants(manager.restaurantIDs);

      // Default to "Manager" if titleName is not provided or is empty
      const titleName = manager.titleName && manager.titleName.trim() ? manager.titleName.trim() : 'Manager';
      const cleanTitleName = toTitleCase(titleName);
      let getTitleResult;
      try {
        getTitleResult = await this.titlesModel.getTitleByName(cleanTitleName);
      } catch (err) {
        // If getTitleByName throws an HttpException, re-throw it
        if (err instanceof HttpException) {
          throw err;
        }
        // Otherwise, log and throw a more specific error
        logger.error(`Error fetching title by name ${cleanTitleName}: ${err?.message || err}`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error occurred while fetching title ${cleanTitleName}`));
      }
      if (!getTitleResult || !getTitleResult.titleID) {
        // if result is empty - title not found in db
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `No titles found with the name ${titleName}`));
      }
      const titleID: number = getTitleResult.titleID;
      const hashedPassword: string = await generatePasswordHash(manager.pwd);
      const newManager: CreateManagerInterface = {
        firstName: manager.firstName,
        lastName: manager.lastName,
        email: manager.email,
        phone: manager.phone,
        pwd: hashedPassword,
        titleID: titleID,
      };
      const createManagerResult = await this.managersModel.createManager(newManager);

      for (const restaurantID of verifiedRestaurants) {
        const newManagerToRestaurantLink: CreateManagerToRestaurantLinkInterface = {
          externalUserID: createManagerResult.id,
          restaurantID: restaurantID,
        };
        await this.managersModel.createManagerToRestaurantLink(newManagerToRestaurantLink);
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of (i.e came from verifyRestaurants function)
        throw err;
      } else {
        logger.error(`Error occurred while creating manager: ${err?.message || err} - ${err?.stack || ''}`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating manager'));
      }
    }
  };

  createManagerEntity = async (manager: ManagerEntity, repository?: EntityManager): Promise<ManagerEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.managersModel.createManagerEntity(
        {
          email: manager.email.toLowerCase(),
          stripe_customer_id: manager.stripe_customer_id,
          position_title_id: 6,
        },
        repository,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating manager. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating manager. Refer to logs for more info.'),
        );
      }
    }
  };

  updateManagerEntity = async (manager: ManagerEntity, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.managersModel.updateManagerInfoByID(manager, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while updating manager. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while updating manager. Refer to logs for more info.'),
        );
      }
    }
  };

  forgotPassword = async (email: string): Promise<void> => {
    try {
      const managerExists = await this.managersModel.getManagerEntityByEmail(email);
      if (!managerExists) {
        logger.error(`Manager unauthorized - provided email doesn't exist for user`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager unauthorized!`));
      }
      const { id: managerID, email: currentEmail, first_name: firstName, pwd: oldPassword } = managerExists;
      const tempPassword = generateRandomPassword(8);
      const hashedPassword: string = await generatePasswordHash(tempPassword);
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await this.managersModel.updateManagerPasswordByID(managerID, hashedPassword, conn);
        try {
          await sendResetPasswordEmail({ email: currentEmail, newPassword: tempPassword, firstName });
        } catch (err) {
          await this.managersModel.updateManagerPasswordByID(managerID, oldPassword, conn);
          if (err instanceof HttpException) {
            // if error has already been typed and taken care of
            throw err;
          } else {
            throw new HttpException(
              500,
              getErrorPayload(
                InternalErrorCode.runtimeError,
                `Error occurred while attempting to send email to user to reset password. Refer to the logs for more detail.`,
              ),
            );
          }
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while resetting user's password - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while resetting user's password. Refer to the logs for more detail.`),
        );
      }
    }
  };

  getManager = async (managerID: number): Promise<GetManagerInterface> => {
    try {
      const manager = await this.managersModel.getManagerAndTitleByID(managerID);
      if (!manager) {
        logger.error(`Manager ${managerID} does not exist`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Manager ${managerID} does not exist`));
      }
      return this.buildManagerResponseFromEntity(manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting manager ${managerID}`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting manager ${managerID}`));
      }
    }
  };

  getManagerByStripeCustomerIDOrEmail = async (stripeCustomerID: string, email: string): Promise<ManagerEntity> => {
    try {
      return await this.managersModel.getManagerByStripeCustomerIDOrEmail(stripeCustomerID, email);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting manager by email and stripe customer id ${stripeCustomerID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting manager by email and stripe customer id ${stripeCustomerID}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  resendEmail = async (email: string): Promise<void> => {
    try {
      const managerExists: ManagerEntity = await this.managersModel.getManagerEntityByEmail(email);
      if (!managerExists) {
        logger.error('Manager does not exist by email');
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager does not exist by email`));
      }

      const { verified_at: verifiedAt, id: managerID, first_name: firstName } = managerExists;

      if (!verifiedAt) {
        const tempEmailCode = generateRandomPassword(8);
        const hashedEmailCode: string = await generatePasswordHash(tempEmailCode);

        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async conn => {
          await this.managersModel.updateManagerEmailCode(managerID, hashedEmailCode, conn);
          try {
            await sendEmailOnboarding(email, tempEmailCode, firstName, managerID);
          } catch (err) {
            if (err instanceof HttpException) {
              // if error has already been typed and taken care of
              throw err;
            } else {
              throw new HttpException(
                500,
                getErrorPayload(
                  InternalErrorCode.runtimeError,
                  `Error ocurred while attempting to re-send email to manager. Refer to the logs for more detail.`,
                ),
              );
            }
          }
        });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error ocurred while attempting to re-send email to manager. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  resetPassword = async (email: string, tempPassword: string, newPassword: string): Promise<TokenDataInterface> => {
    try {
      const managerExists: ManagerEntity = await this.managersModel.getManagerEntityByEmail(email);
      if (!managerExists) {
        logger.error('Manager does not exist by Email');
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, 'Manager does not exist by Email'));
      }

      const existingID: number = managerExists.id;
      const currentPassword: string = managerExists.pwd;
      // Check password validity
      const isValid = await bcrypt.compare(tempPassword, currentPassword);
      if (!isValid) {
        logger.warn(`Manager temp password is not valid`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager temp password is not valid`));
      }
      const hashedPassword = await generatePasswordHash(newPassword);

      await this.managersModel.updateManagerPasswordByID(existingID, hashedPassword);

      return generateToken(existingID);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error('Error occurred while setting new password');
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while setting new password'));
      }
    }
  };

  signupManager = async (manager: CreateManagerInterface): Promise<string> => {
    try {
      manager.email = manager.email.toLowerCase();
      const { firstName, lastName, phone, email, stripeCustomerID, pwd } = manager;

      if (stripeCustomerID) {
        const stripeCustomer = await this.managersModel.getManagerByStripeCustomerIDOrEmail(stripeCustomerID, email);

        if ((stripeCustomer && !stripeCustomer.stripe_customer_id) || !stripeCustomer) {
          logger.error(`Provided stripe customer id ${stripeCustomerID} does not exist for a manager.`);
          throw new HttpException(
            404,
            getErrorPayload(InternalErrorCode.inputValueNotInDB, `Provided stripe customer id ${stripeCustomerID} does not exist for a manager.`),
          );
        }

        if (stripeCustomer.verified_at != null) {
          logger.error(`Manager already exists with id: ${stripeCustomer.id}.`);
          throw new HttpException(409, getErrorPayload(InternalErrorCode.resourceConflict, `Manager already exists with id: ${stripeCustomer.id}.`));
        }

        const managerToUpdate: ManagerEntity = {
          ...stripeCustomer,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          pwd: await generatePasswordHash(pwd),
          verified_at: getCurrentDate(),
        };
        await this.managersModel.updateManagerInfoByID(managerToUpdate);

        return generateToken(stripeCustomer.id).token;
      } else {
        const managerExists = await this.managersModel.getManagerEntityByEmail(email);
        if (managerExists) {
          if (managerExists.verified_at) {
            // If it exists and is verified then we know a user is already using this account.
            // It can be viewed as best interest not to let a bad actor know that the account exists for a user so just throw unauthorized
            logger.error(`Manager already exists with id: ${managerExists.id}.`);
            throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Unauthorized.`));
          } else {
            // If it exists but wasn't verified we threw a 409.
            // This would let the frontend know that the customer exists but still needs to verify the email,
            // so it would prompt the user to try and send the verification code again.
            logger.error(`Manager already exists with id: ${managerExists.id}.`);
            throw new HttpException(409, getErrorPayload(InternalErrorCode.resourceConflict, `Manager already exists with id: ${managerExists.id}.`));
          }
        }

        const getTitleResult = await this.titlesModel.getTitleByName(toTitleCase(manager.titleName));
        if (!getTitleResult) {
          // if result is empty - title not found in db
          throw new HttpException(
            400,
            getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `No title found with the name ${manager.titleName}`),
          );
        }

        const emailCode = generateRandomPassword(8);
        const newManager = await this.buildDBManagerAndHashPasswordAndEmailCode(getTitleResult.titleID, manager, emailCode);
        const ormConn: EntityManager = await ormConnection();
        let managerID;
        await ormConn.transaction(async conn => {
          managerID = (await this.managersModel.createManagerEntity(newManager, conn)).id;
          try {
            if (managerID) {
              await sendEmailOnboarding(email, emailCode, firstName, managerID);
            } else {
              throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Invalid value for managerID: ${managerID}`));
            }
          } catch (err) {
            if (err instanceof HttpException) {
              // if error has already been typed and taken care of
              throw err;
            } else {
              logger.error(`Error occurred while attempting to send email to user to verify account. -` + err);
              throw new HttpException(
                500,
                getErrorPayload(
                  InternalErrorCode.runtimeError,
                  `Error occurred while attempting to send email to user to verify account. Refer to the logs for more detail.`,
                ),
              );
            }
          }
        });

        return null;
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of (i.e came from verifyRestaurants function)
        throw err;
      } else {
        logger.error(`Error occurred while creating manager account through onboarding. -` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating manager account through onboarding. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  updatePassword = async (managerID: number, currentPassword: string, newPassword: string): Promise<void> => {
    try {
      this.validateManagerPassword(newPassword);
      const managerExists: ManagerEntity = await this.managersModel.getManagerEntityByID(managerID);
      if (!managerExists) {
        logger.error('Manager does not exist by ID');
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, 'Manager does not exist by ID'));
      }
      const oldPassword: string = managerExists.pwd;
      // Check password validity
      const isValid = await bcrypt.compare(currentPassword, oldPassword);
      if (!isValid) {
        logger.warn(`Manager current password is not valid`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager current password is not valid`));
      }

      const hashedPassword = await generatePasswordHash(newPassword);

      await this.managersModel.updateManagerPasswordByID(managerID, hashedPassword);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error('Error occurred while updating new password');
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while updating new password'));
      }
    }
  };

  verifyManager = async (managerID: number, verificationCode: string): Promise<TokenDataInterface> => {
    try {
      // check if manager exists
      const managerExists = await this.managersModel.getManagerEntityByID(managerID);
      if (!managerExists) {
        logger.error(`Manager unauthorized - provided id doesn't exist for user`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager unauthorized!`));
      }

      // check if manager is already verified
      const { email_code: emailCode, verified_at: verifiedAt } = managerExists;
      if (verifiedAt) {
        logger.error(`Manager ${managerID} has already been verified `);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager ${managerID} has already been verified`));
      }

      // check if email_code is null
      if (!emailCode) {
        logger.error(`Manager ${managerID} email_code not set`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager ${managerID} email_code not set`));
      }

      // compare db verification email code vs request
      const isValid = await bcrypt.compare(verificationCode, emailCode);
      if (!isValid) {
        logger.error(`Manager unauthorized - verificationCode does not match email_code for manager user ${managerID}`);
        throw new HttpException(
          401,
          getErrorPayload(
            InternalErrorCode.unauthorizedUser,
            `Manager unauthorized - verificationCode does not match email_code for manager user ${managerID}`,
          ),
        );
      }

      // set verified_at to timestamp and email_code to null
      await this.managersModel.setVerifiedAtAndResetEmailCode(managerID);

      return generateToken(managerID);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while attempting to verify manager - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while attempting to verify manager. Refer to the logs for more detail.`),
        );
      }
    }
  };

  editManagerInfoByID = async (managerID: number, stripeCustomerID: string, editManagerInfo: ManagerEditInfoRequestInterface): Promise<void> => {
    try {
      const email = editManagerInfo.email;
      const managerExists = await this.managersModel.getManagerEntityByEmail(email);
      if (managerExists && managerExists.id !== managerID) {
        logger.error(`The provided email is already in use.`);
        throw new HttpException(409, getErrorPayload(InternalErrorCode.resourceConflict, `The provided email is already in use.`));
      }
      if (stripeCustomerID) {
        await stripe.customers.update(stripeCustomerID, {
          name: `${editManagerInfo.firstName} ${editManagerInfo.lastName}`,
          email: editManagerInfo.email,
          phone: editManagerInfo.phone,
        });
      }
      await this.managersModel.updateManagerInfoByID(this.buildManagerEntity(managerID, editManagerInfo));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing manager. - ` + err);
        const stripeErrorCodes = Object.values(StripeRawErrorType);
        if (stripeErrorCodes.includes(err.rawType)) {
          throw new HttpException(
            500,
            getErrorPayload(InternalErrorCode.stripeException, `Error occurred while editing manager: ${managerID}. Refer to logs for more info.`),
          );
        } else {
          throw new HttpException(
            500,
            getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while editing manager: ${managerID}. Refer to logs for more info.`),
          );
        }
      }
    }
  };

  buildManagerEntity = (managerID: number, editManagerInfo: ManagerEditInfoRequestInterface): ManagerEntity => {
    return {
      first_name: editManagerInfo.firstName,
      last_name: editManagerInfo.lastName,
      email: editManagerInfo.email,
      phone: editManagerInfo.phone,
      id: managerID,
    } as ManagerEntity;
  };

  buildDBManagerAndHashPasswordAndEmailCode = async (
    titleID: number,
    manager: CreateManagerInterface,
    tempEmailCode: string,
  ): Promise<ManagerDBInterface> => {
    try {
      const hashedPassword: string = await generatePasswordHash(manager.pwd);
      const hashedEmailCode: string = await generatePasswordHash(tempEmailCode);
      const newManager: ManagerDBInterface = {
        first_name: manager.firstName,
        last_name: manager.lastName,
        email: manager.email,
        phone: manager.phone,
        pwd: hashedPassword,
        email_code: hashedEmailCode,
        position_title_id: titleID,
      };
      return newManager;
    } catch (err) {
      logger.error('Error occurred building manager for database insert');
      throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred building manager for database insert'));
    }
  };

  buildManagerResponseFromEntity = (manager: ManagerEntity): GetManagerInterface => {
    try {
      return {
        firstName: manager.first_name,
        lastName: manager.last_name,
        email: manager.email,
        phone: manager.phone,
        title: {
          titleID: manager.position_title_id['id'],
          name: manager.position_title_id['name'],
        },
      } as GetManagerInterface;
    } catch (err) {
      logger.error(`Error occurred building manager response from entity for manager`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred building manager response from entity for manager`),
      );
    }
  };

  /**
   * Calls passwordIsValid function and throws 400 error if not valid
   * @param password string
   */
  validateManagerPassword = password => {
    const isPasswordValid = passwordIsValid(password);
    if (!isPasswordValid) {
      logger.error('Manager password invalid, must have >= 9 characters, a special character, a number, a lowercase letter, and an uppercase letter');
      throw new HttpException(
        400,
        getErrorPayload(
          InternalErrorCode.missingInputOrIncorrectType,
          'Manager password invalid, must have >= 9 characters, a special character, a number, a lowercase letter, and an uppercase letter',
        ),
      );
    }
  };
}

export default ManagersService;
