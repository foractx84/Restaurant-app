import { UserInterface } from '@/interfaces/users.interface';
import UsersModel from '@/models/users.model';
import AuthService from '@/services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HttpException } from '@/exceptions/HttpException';

// mock dependencies - isolate service
jest.mock('@/models/users.model', () => {
  const mockUsersModel = {
    validateManagerAuthorized: jest.fn(),
    getManager: jest.fn(),
    getSuperUser: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockUsersModel) };
});
jest.mock('@/configs/config', () => {
  return { __esModule: true, databaseConfig: {}, JWT: { ADMIN_VALIDITY_MS: 1000, ALGORITHM: 'HS26', SECRET_KEY: 'SHH' } };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/exceptions/HttpException', () => {
  return { __esModule: true, getErrorPayload: jest.fn(), HttpException: Error, InternalErrorCode: jest.fn() };
});
jest.mock('bcrypt', () => {
  const bcrypt = {
    compare: jest.fn(),
  };
  return { __esModule: true, default: bcrypt };
});
jest.mock('jsonwebtoken', () => {
  const jwt = {
    sign: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});

// create mock users model object
const mockUsersModel = new UsersModel();
const authService = new AuthService(mockUsersModel);

describe('authService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateManager', () => {
    const RESTAURANT_ID = 2;
    const MANAGER_ID = 3;
    it('should successfully validate manager', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.validateManagerAuthorized as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      // call on the service like the controller would
      const result = await authService.validateManager(MANAGER_ID, RESTAURANT_ID);
      // enforce test expectations
      expect(mockUsersModel.validateManagerAuthorized).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });
  });

  describe('authenticateLogin', () => {
    const TOKEN = 'token';
    const EMAIL = 'test@email.com';
    const USER: UserInterface = {
      email: EMAIL,
      password: 'password',
    };
    const returnedManager = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: EMAIL,
      phone: '55555555555',
      pwd: 'encryped_password',
      position_title_id: 6,
      verified_at: '2021-01-01T00:00:00Z',
    };
    const unverifiedManager = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: EMAIL,
      phone: '55555555555',
      pwd: 'encryped_password',
      position_title_id: 6,
    };
    const returnedSuperUser = {
      id: 2,
      first_name: 'Super',
      last_name: 'User',
      email: EMAIL,
      phone: '55555555555',
      account_type: 'admin',
      meta_user_type: null,
      pwd: 'encryped_password',
      approved: true,
    };
    it('should successfully authenticate manager and return signed token and false booleans hasPairings and hasImageUpload', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockUsersModel.getManager as jest.MockedFunction<any>).mockResolvedValueOnce(returnedManager);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      (jwt.sign as jest.MockedFunction<any>).mockImplementation(() => TOKEN);
      // call on the service like the controller would
      const result = await authService.authenticateLogin(USER);
      // enforce test expectations
      expect(mockUsersModel.getSuperUser).toHaveBeenCalledTimes(1);
      expect(mockUsersModel.getManager).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ token: TOKEN, hasPairings: false, hasImageUpload: false });
    });
    it('should successfully authenticate special user (super user) and return signed token and true boolean hasPairings and hasImageUpload', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(returnedSuperUser);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      (jwt.sign as jest.MockedFunction<any>).mockImplementation(() => TOKEN);
      // call on the service like the controller would
      const result = await authService.authenticateLogin(USER);
      // enforce test expectations
      expect(mockUsersModel.getSuperUser).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ token: TOKEN, hasPairings: true, hasImageUpload: true });
    });
    it('should throw 401 Unauthorized when manager not found for email provided', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockUsersModel.getManager as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      // call on the service like the controller would
      try {
        await authService.authenticateLogin(USER);
      } catch (error) {
        expect(error).toBeTruthy();
      }
      // enforce test expectations
      expect(mockUsersModel.getManager).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });
    it('should throw 401 Unauthorized when stored password does not match password provided for regular, external manager', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockUsersModel.getManager as jest.MockedFunction<any>).mockResolvedValueOnce(returnedManager);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => false);
      // call on the service like the controller would
      try {
        await authService.authenticateLogin(USER);
      } catch (error) {
        expect(error).toBeTruthy();
      }
      // enforce test expectations
      expect(mockUsersModel.getSuperUser).toHaveBeenCalledTimes(1);
      expect(mockUsersModel.getManager).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
    it('should throw 401 Unauthorized when stored password does not match password provided for special_user (superUser)', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(returnedSuperUser);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => false);
      // call on the service like the controller would
      try {
        await authService.authenticateLogin(USER);
      } catch (error) {
        expect(error).toBeTruthy();
      }
      // enforce test expectations
      expect(mockUsersModel.getSuperUser).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
    it('should throw 500 Internal Server Error when error occurs while signing JWT token', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockUsersModel.getManager as jest.MockedFunction<any>).mockResolvedValueOnce(returnedManager);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      (jwt.sign as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(500, { code: 500, message: 'Error' });
      });
      // call on the service like the controller would
      try {
        await authService.authenticateLogin(USER);
      } catch (error) {
        expect(error).toBeTruthy();
      }
      // enforce test expectations
      expect(mockUsersModel.getManager).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
    });
    it('should throw 412 error due to user not being verified (verified_at = null)', async () => {
      // set up mock users model to return our mock response to service
      (mockUsersModel.getSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockUsersModel.getManager as jest.MockedFunction<any>).mockResolvedValueOnce(unverifiedManager);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      // call on the service like the controller would
      try {
        await authService.authenticateLogin(USER);
      } catch (err) {
        expect(err.payload instanceof HttpException);
      }
      // enforce test expectations
      expect(mockUsersModel.getSuperUser).toHaveBeenCalledTimes(1);
      expect(mockUsersModel.getManager).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });
  });
});
