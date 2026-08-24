import bcrypt from 'bcrypt';
import { logger } from '@/utils/logger';
import { UserDBInterface, UserInterface } from '@interfaces/users.interface';
import { AuthModelsInterface, TokenDataInterface, AuthServiceInterface } from '@/interfaces/auth.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { SpecialUserEntity } from '@/entities/special_user.entity';
import { generateToken } from '@/utils/generateToken';

class AuthService implements AuthServiceInterface {
  private userModel: AuthModelsInterface;

  constructor(userModel: AuthModelsInterface) {
    this.userModel = userModel;
  }

  authenticateLogin = async (user: UserInterface): Promise<TokenDataInterface> => {
    // check first super user
    const superUser: SpecialUserEntity = await this.userModel.getSuperUser(user.email);
    const account = {
      pwd: '',
      id: null,
      verified_at: null,
    };
    if (superUser) {
      account.pwd = superUser.pwd;
      account.id = superUser.id;
      account.verified_at = new Date();
    } else {
      // check second external user
      const manager: UserDBInterface = await this.userModel.getManager(user.email);
      if (!manager) {
        logger.warn(`No manager found with the provided email`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
      }
      account.pwd = manager.pwd;
      account.id = manager.id;
      account.verified_at = manager.verified_at;
    }

    // Check password validity
    const isValid = await bcrypt.compare(user.password, account.pwd);
    if (!isValid) {
      logger.warn(`Manager password is not valid`);
      throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
    }

    // verified_at timestamp check
    if (!account.verified_at) {
      logger.warn(`Manager is not verified, verified_at timestamp is not set`);
      throw new HttpException(412, getErrorPayload(InternalErrorCode.unauthorizedUser, `Manager is not verified, verified_at timestamp is not set`));
    }

    return generateToken(account.id, !!superUser);
  };

  validateManager = async (managerID: number, restaurantID: number): Promise<boolean> => {
    return await this.userModel.validateManagerAuthorized(managerID, restaurantID);
  };

  validateSuperUser = async (id: number): Promise<boolean> => {
    return !!(await this.userModel.findSuperUserByID(id));
  };
}
/**
 * Generate hash for given password
 * @param {string} password Password text
 */
export const generatePasswordHash = async (password: string): Promise<string> => {
  const hashedPassword: string = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export default AuthService;
