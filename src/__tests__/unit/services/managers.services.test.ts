import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@/exceptions/HttpException';
import { CreateManagerDBInterface, CreateManagerInterface, ManagerEditInfoRequestInterface } from '@/interfaces/managers.interface';
import { TitlesDBInterface } from '@/interfaces/titles.interface';
import ManagersModel from '@/models/managers.model';
import TitlesModel from '@/models/titles.model';
import { generatePasswordHash } from '@/services/auth.service';
import ManagersService from '@/services/managers.service';
import RestaurantsService from '@/services/restaurants.service';
import { toTitleCase, generateRandomPassword } from '@/utils/util';
import bcrypt from 'bcrypt';
import { ormConnection } from '@/utils/dbUtils';
import { passwordIsValid } from '@/utils/passwordUtils';
import { generateToken } from '@/utils/generateToken';
import { ManagerEntity } from '@/entities/manager.entity';
import { RestaurantImagesServiceInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantsModelInterface } from '@/interfaces/restaurants.interface';
import { CuisinesServiceInterface } from '@/interfaces/cuisines.interface';
import { CountryServiceInterface } from '@/interfaces/country.interface';
import { RestaurantAddressServiceInterface } from '@/interfaces/restaurantAddress.interface';
import { ManagerRestaurantServiceInterface } from '@/interfaces/managerRestaurant.interface';
import { RestaurantSocialsServiceInterface } from '@/interfaces/restaurantSocials.interface';
import { RestaurantHoursServiceInterface } from '@/interfaces/restaurantHours.interface';
import { RestaurantProfileAlbumsServiceInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';

// mock the managers model
jest.mock('@/models/managers.model', () => {
  const mockManagersModel = {
    createManager: jest.fn(),
    createManagerEntity: jest.fn(),
    createManagerToRestaurantLink: jest.fn(),
    getManagerAndTitleByID: jest.fn(),
    getManagerEntityByEmail: jest.fn(),
    getManagerEntityByID: jest.fn(),
    getManagerByStripeCustomerIDOrEmail: jest.fn(),
    updateManagerPasswordByID: jest.fn(),
    setVerifiedAtAndResetEmailCode: jest.fn(),
    updateManagerInfoByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagersModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/util', () => {
  return { __esModule: true, generateRandomPassword: jest.fn(), toTitleCase: jest.fn(), getCurrentDate: jest.fn() };
});
jest.mock('@/utils/timeUtils', () => {
  return { __esModule: true, getCurrentDate: jest.fn() };
});
jest.mock('@/utils/passwordUtils', () => {
  return { __esModule: true, passwordIsValid: jest.fn() };
});
jest.mock('@/utils/generateToken', () => {
  return { __esModule: true, generateToken: jest.fn() };
});
jest.mock('@/services/auth.service', () => {
  return { __esModule: true, generatePasswordHash: jest.fn() };
});

// mock the titles model
jest.mock('@/models/titles.model', () => {
  const mockTitlesModel = {
    getTitleByName: jest.fn(),
    getTitles: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTitlesModel) };
});
// mock the restaurants service
jest.mock('@/services/restaurants.service', () => {
  const mockRestaurantsService = {
    verifyRestaurants: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantsService) };
});
jest.mock('@/utils/emailUtils', () => {
  return {
    __esModule: true,
    sendResetPasswordEmail: jest.fn(),
  };
});
jest.mock('bcrypt', () => {
  const bcrypt = {
    compare: jest.fn(),
  };
  return { __esModule: true, default: bcrypt };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('stripe', () => {
  const stripeMock = {
    customers: {
      update: jest.fn(),
    },
  };
  return { __esModule: true, default: jest.fn(() => stripeMock) };
});

// create mock managers model object
const mockManagersModel = new ManagersModel();
const mockTitlesModel = new TitlesModel();
const mockRestaurantsService = new RestaurantsService(
  {} as CountryServiceInterface,
  {} as CuisinesServiceInterface,
  {} as ManagerRestaurantServiceInterface,
  {} as RestaurantAddressServiceInterface,
  {} as RestaurantImagesServiceInterface,
  {} as RestaurantsModelInterface,
  {} as RestaurantSocialsServiceInterface,
  {} as RestaurantHoursServiceInterface,
  {} as RestaurantProfileAlbumsServiceInterface,
  { createConnectedAccountForRestaurant: jest.fn(), linkExistingConnectAccount: jest.fn() } as StripeConnectServiceInterface,
);
const managersService = new ManagersService(mockManagersModel, mockTitlesModel, mockRestaurantsService);

describe('managersService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createManager', () => {
    it('should successfully create a manager for two restaurants using an existing title and special_users (super user)', async () => {
      const mockVerifyRestaurantsResponse: number[] = [1, 2];
      const mockGetTitleByNameModelResponse: TitlesDBInterface = {
        titleID: 1,
        name: 'Test Position',
      };
      const mockCreateManagerResponse: CreateManagerDBInterface = { id: 15 };
      // set up mock managers model to return our mock response to service
      (mockRestaurantsService.verifyRestaurants as jest.MockedFunction<any>).mockResolvedValueOnce(mockVerifyRestaurantsResponse);
      (mockTitlesModel.getTitleByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTitleByNameModelResponse);
      (mockManagersModel.createManager as jest.MockedFunction<any>).mockResolvedValueOnce(mockCreateManagerResponse);
      // mock function params
      const mockManager: CreateManagerInterface = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: 'testPassword',
        titleName: 'Test Position',
        restaurantIDs: [1, 2],
      };
      // call on the service like the controller would
      await managersService.createManager(mockManager);
      // enforce test expectations
      expect(mockRestaurantsService.verifyRestaurants).toHaveBeenCalledTimes(1);
      expect(toTitleCase).toHaveBeenCalledTimes(1);
      expect(mockTitlesModel.getTitleByName).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(1);
      expect(mockManagersModel.createManager).toHaveBeenCalledTimes(1);
      expect(mockManagersModel.createManagerToRestaurantLink).toHaveBeenCalledTimes(2);
    });

    it('should not successfully create a manager because restaurants not verified', async () => {
      // set up mock managers model to return our mock response to service
      (mockRestaurantsService.verifyRestaurants as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Test verifyRestaurants Exception Thrown`)); // throws error bc couldn't verify restaurants
      });
      // mock function params
      const mockManager: CreateManagerInterface = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: 'testPassword',
        titleName: 'Test Position',
        restaurantIDs: [1, 2],
      };
      // enforce test expectations
      await expect(managersService.createManager(mockManager)).rejects.toThrow(HttpException);
      expect(mockRestaurantsService.verifyRestaurants).toHaveBeenCalledTimes(1);
      expect(toTitleCase).toHaveBeenCalledTimes(0);
      expect(mockTitlesModel.getTitleByName).toHaveBeenCalledTimes(0);
      expect(generatePasswordHash).toHaveBeenCalledTimes(0);
      expect(mockManagersModel.createManager).toHaveBeenCalledTimes(0);
      expect(mockManagersModel.createManagerToRestaurantLink).toHaveBeenCalledTimes(0);
    });
    it('should not successfully create a manager because title was not found', async () => {
      const mockVerifyRestaurantsResponse: number[] = [1, 2];
      const mockGetTitleByNameModelResponse = undefined as TitlesDBInterface;
      // set up mock managers model to return our mock response to service
      (mockRestaurantsService.verifyRestaurants as jest.MockedFunction<any>).mockResolvedValueOnce(mockVerifyRestaurantsResponse);
      (mockTitlesModel.getTitleByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTitleByNameModelResponse);
      // mock function params
      const mockManager: CreateManagerInterface = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: 'testPassword',
        titleName: 'Test Position Non Existing',
        restaurantIDs: [1, 2],
      };
      // call on the service like the controller would
      await expect(managersService.createManager(mockManager)).rejects.toThrow(HttpException);
      // enforce test expectations
      expect(mockRestaurantsService.verifyRestaurants).toHaveBeenCalledTimes(1);
      expect(toTitleCase).toHaveBeenCalledTimes(1);
      expect(mockTitlesModel.getTitleByName).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(0);
      expect(mockManagersModel.createManager).toHaveBeenCalledTimes(0);
      expect(mockManagersModel.createManagerToRestaurantLink).toHaveBeenCalledTimes(0);
    });
  });
  describe('createManagerEntity', () => {
    const mockManager: ManagerEntity = {
      email: 'john@smith.com',
      stripe_customer_id: 'random_customer_id',
    };
    it('should successfully create a manager entity', async () => {
      const mockCreateManagerResponse: ManagerEntity = { id: 15, email: 'john@smith.com' };
      // set up mock managers model to return our mock response to service
      (mockManagersModel.createManagerEntity as jest.MockedFunction<any>).mockResolvedValueOnce(mockCreateManagerResponse);

      const result = await managersService.createManagerEntity(mockManager);

      expect(mockManagersModel.createManagerEntity).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCreateManagerResponse);
    });
    it('should throw 500 HttpException if error thrown while creating a manager', async () => {
      (mockManagersModel.createManagerEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managersService.createManagerEntity(mockManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagersModel.createManagerEntity).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateManagerEntity', () => {
    const mockManager: ManagerEntity = {
      email: 'john@smith.com',
      stripe_customer_id: 'random_customer_id',
    };
    it('should successfully update a manager entity', async () => {
      await managersService.updateManagerEntity(mockManager);

      expect(mockManagersModel.updateManagerInfoByID).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if error thrown while updating a manager', async () => {
      (mockManagersModel.updateManagerInfoByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managersService.updateManagerEntity(mockManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockManagersModel.updateManagerInfoByID).toHaveBeenCalledTimes(1);
    });
  });
  describe('signupManager', () => {
    // mock function params
    const mockManager = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@smith.com',
      phone: '1112220000',
      pwd: 'abcdefg12345',
      titleName: 'Manager',
    };
    const mockCreateManagerResponse = {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@smith.com',
      phone: '1112220000',
      pwd: 'abcdefg12345',
      email_code: '12345abcdefg',
      position_title_id: 6,
    };
    const mockGetTitleByNameModelResponse: TitlesDBInterface = {
      titleID: 6,
      name: 'Manager',
    };
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';
    const token = {
      token: 'random_string',
    };
    it('should successfully sign up manager and return token when stripe customer id is provided', async () => {
      (mockManagersModel.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...mockCreateManagerResponse,
        stripe_customer_id: STRIPE_CUSTOMER_ID,
      });
      (generateToken as jest.MockedFunction<any>).mockImplementation(() => token);

      const result = await managersService.signupManager({ ...mockManager, stripeCustomerID: STRIPE_CUSTOMER_ID });

      expect(mockManagersModel.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, mockManager.email);
      expect(mockManagersModel.updateManagerInfoByID).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(1);
      expect(generateToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(token.token);
    });
    it('should throw 404 if manager does not exist when stripe customer id is provided', async () => {
      try {
        await managersService.signupManager({ ...mockManager, stripeCustomerID: STRIPE_CUSTOMER_ID });
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, mockManager.email);
      expect(mockManagersModel.updateManagerInfoByID).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
    it('should throw 409 if manager found has already been verified when stripe customer id is provided', async () => {
      (mockManagersModel.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...mockCreateManagerResponse,
        stripe_customer_id: STRIPE_CUSTOMER_ID,
        verified_at: '2022-01-01T00:00:00',
      });

      try {
        await managersService.signupManager({ ...mockManager, stripeCustomerID: STRIPE_CUSTOMER_ID });
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, mockManager.email);
      expect(mockManagersModel.updateManagerInfoByID).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
    it('should successfully create a manager for onboarding app flow', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (toTitleCase as jest.MockedFunction<any>).mockReturnValueOnce(mockManager.titleName);
      (mockTitlesModel.getTitleByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTitleByNameModelResponse);
      (mockManagersModel.createManager as jest.MockedFunction<any>).mockResolvedValueOnce(mockCreateManagerResponse);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
      // call on the service like the controller would
      await managersService.signupManager(mockManager);

      // enforce test expectations
      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(mockManager.email);
      expect(toTitleCase).toHaveBeenCalledWith(mockManager.titleName);
      expect(mockTitlesModel.getTitleByName).toHaveBeenCalledWith(mockManager.titleName);
      expect(generatePasswordHash).toHaveBeenCalledTimes(2);
      expect(generateRandomPassword).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 409 conflict since email already exists for a manager who is not verified', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockCreateManagerResponse);

      try {
        // call on the service like the controller would
        await managersService.signupManager(mockManager);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      // enforce test expectations
      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(mockManager.email);
      expect(toTitleCase).not.toHaveBeenCalled();
      expect(mockTitlesModel.getTitleByName).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(generateRandomPassword).not.toHaveBeenCalled();
      expect(ormConnection).not.toHaveBeenCalled();
    });
    it('should throw 401 conflict since email already exists for a manager and manager is verified', async () => {
      const mockCreateManagerResponseVerified = {
        id: 1,
        first_name: 'John',
        last_name: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: 'abcdefg12345',
        email_code: '12345abcdefg',
        position_title_id: 6,
        verified_at: '2021-07-26T00:00:00Z',
      };

      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockCreateManagerResponseVerified);

      try {
        // call on the service like the controller would
        await managersService.signupManager(mockManager);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      // enforce test expectations
      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(mockManager.email);
      expect(toTitleCase).not.toHaveBeenCalled();
      expect(mockTitlesModel.getTitleByName).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(generateRandomPassword).not.toHaveBeenCalled();
      expect(ormConnection).not.toHaveBeenCalled();
    });
    it('should not successfully create a manager because title was not found', async () => {
      // mock function params
      const invalidTitleManager = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: 'bad',
        email_code: '12345abcdefg',
        titleName: 'Bad Title',
      };
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (passwordIsValid as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      (toTitleCase as jest.MockedFunction<any>).mockReturnValueOnce(invalidTitleManager.titleName);
      (mockTitlesModel.getTitleByName as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        // call on the service like the controller would
        await managersService.signupManager(invalidTitleManager);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      // enforce test expectations
      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(invalidTitleManager.email);
      expect(toTitleCase).toHaveBeenCalledWith(invalidTitleManager.titleName);
      expect(mockTitlesModel.getTitleByName).toHaveBeenCalledWith(invalidTitleManager.titleName);
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(generateRandomPassword).not.toHaveBeenCalled();
      expect(ormConnection).not.toHaveBeenCalled();
    });
  });
  describe('forgotPassword', () => {
    const EMAIL = 'manager@fake.com';
    const mockManagerResponse = {
      id: 1,
      email: EMAIL,
      first_name: 'dummy first',
      last_name: 'dummy last',
    };
    it('should successfully reset a password to user and send reset email instructions to their email', async () => {
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponse);
      (generateRandomPassword as jest.MockedFunction<any>).mockReturnValueOnce('random_password');
      (generatePasswordHash as jest.MockedFunction<any>).mockReturnValueOnce('hashed_password');
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await managersService.forgotPassword(EMAIL);

      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledTimes(1);
      expect(generateRandomPassword).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(1);
      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 401 HttpException cant find existing manager with provided email', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(false);

      try {
        await managersService.forgotPassword(EMAIL);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 500 HttpException if any error occurs in resetPassword', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managersService.forgotPassword(EMAIL);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('resetPassword', () => {
    const EMAIL = 'manager@fake.com';
    const OLD_PASSWORD = 'old_password';
    const NEW_PASSWORD = 'new_password';
    const mockManagerResponse = {
      id: 1,
      email: EMAIL,
      first_name: 'dummy first',
      last_name: 'dummy last',
    };
    const token = {
      token: 'random_string',
    };
    it('should successfully set a new password for user', async () => {
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponse);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      (generatePasswordHash as jest.MockedFunction<any>).mockReturnValueOnce('hashed_password');
      (mockManagersModel.updateManagerPasswordByID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      (generateToken as jest.MockedFunction<any>).mockImplementation(() => token);

      const result = await managersService.resetPassword(EMAIL, OLD_PASSWORD, NEW_PASSWORD);

      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(1);
      expect(mockManagersModel.updateManagerPasswordByID).toHaveBeenCalledTimes(1);
      expect(generateToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(token);
    });
    it('should throw 401 HttpException cant find existing manager with provided email', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(false);

      try {
        await managersService.resetPassword(EMAIL, OLD_PASSWORD, NEW_PASSWORD);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 401 HttpException if passwords do not match', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponse);
      (bcrypt.compare as jest.MockedFunction<any>).mockReturnValueOnce(false);

      try {
        await managersService.resetPassword(EMAIL, OLD_PASSWORD, NEW_PASSWORD);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 500 HttpException if any error occurs in resetPassword', async () => {
      // set up mock managers model to return our mock response to service
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managersService.resetPassword(EMAIL, OLD_PASSWORD, NEW_PASSWORD);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updatePassword', () => {
    const MANAGER_ID = 1;
    const OLD_PASSWORD = 'old_password';
    const NEW_WRONG_PASSWORD = 'new_password';
    const NEW_CORRECT_PASSWORD = 'New_password3!';
    const mockManagerResponse = {
      id: 1,
      first_name: 'dummy first',
      last_name: 'dummy last',
      pwd: 'hashed_old_password',
    };
    it('should successfully update password for user', async () => {
      (passwordIsValid as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponse);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      (generatePasswordHash as jest.MockedFunction<any>).mockReturnValueOnce('hashed_password');
      (mockManagersModel.updateManagerPasswordByID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await managersService.updatePassword(MANAGER_ID, OLD_PASSWORD, NEW_CORRECT_PASSWORD);

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(1);
      expect(mockManagersModel.updateManagerPasswordByID).toHaveBeenCalledTimes(1);
    });
    it('should throw 401 HttpException cant find existing manager with provided managerID', async () => {
      // set up mock managers model to return our mock response to service
      (passwordIsValid as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(false);

      try {
        await managersService.updatePassword(MANAGER_ID, OLD_PASSWORD, NEW_CORRECT_PASSWORD);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 401 HttpException if old password does not match with current password', async () => {
      // set up mock managers model to return our mock response to service
      (passwordIsValid as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponse);
      (bcrypt.compare as jest.MockedFunction<any>).mockReturnValueOnce(false);

      try {
        await managersService.updatePassword(MANAGER_ID, OLD_PASSWORD, NEW_CORRECT_PASSWORD);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 400 HttpException if new password does not have special character, a number, uppercase letter, lowercase letter, and >= 8 characters', async () => {
      try {
        await managersService.updatePassword(MANAGER_ID, OLD_PASSWORD, NEW_WRONG_PASSWORD);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('verifyManager', () => {
    const TOKEN = 'token';
    const tokenResponse = {
      token: TOKEN,
      hasImageUpload: false,
      hasPairings: false,
    };
    const verifyRequest = {
      managerID: 1,
      verificationCode: 'some code',
    };
    const mockManagerResponseNotVerified = {
      id: 1,
      first_name: 'dummy first',
      last_name: 'dummy last',
      email_code: 'hashed_email_code',
      verified_at: null,
    };
    const mockManagerResponseVerified = {
      id: 2,
      first_name: 'dummy first',
      last_name: 'dummy last',
      email_code: 'hashed_email_code',
      verified_at: '2022-01-01T00:00:00Z',
    };
    const mockManagerResponseNullEmailCode = {
      id: 2,
      first_name: 'dummy first',
      last_name: 'dummy last',
      email_code: null,
      verified_at: null,
    };
    it('should successfully update verified_at for user', async () => {
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponseNotVerified);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);
      (generateToken as jest.MockedFunction<any>).mockImplementation(() => tokenResponse);
      (mockManagersModel.setVerifiedAtAndResetEmailCode as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      const result = await managersService.verifyManager(verifyRequest.managerID, verifyRequest.verificationCode);

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(bcrypt.compare).toHaveBeenCalledWith(verifyRequest.verificationCode, mockManagerResponseNotVerified.email_code);
      expect(mockManagersModel.setVerifiedAtAndResetEmailCode).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(generateToken).toHaveBeenCalledWith(verifyRequest.managerID);

      expect(result).toEqual({ token: TOKEN, hasImageUpload: false, hasPairings: false });
    });
    it('should throw 401 HttpException manager doesnt exist', async () => {
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await managersService.verifyManager(verifyRequest.managerID, verifyRequest.verificationCode);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockManagersModel.setVerifiedAtAndResetEmailCode).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
    it('should throw 401 HttpException if verified_at already set to timestamp', async () => {
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponseVerified);

      try {
        await managersService.verifyManager(verifyRequest.managerID, verifyRequest.verificationCode);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockManagersModel.setVerifiedAtAndResetEmailCode).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
    it('should throw 401 HttpException if email code is null', async () => {
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponseNullEmailCode);

      try {
        await managersService.verifyManager(verifyRequest.managerID, verifyRequest.verificationCode);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockManagersModel.setVerifiedAtAndResetEmailCode).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
    it('should throw 401 HttpException if verificationCode does not match email_code code', async () => {
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponseNullEmailCode);
      (bcrypt.compare as jest.MockedFunction<any>).mockImplementation(() => true);

      try {
        await managersService.verifyManager(verifyRequest.managerID, verifyRequest.verificationCode);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockManagersModel.setVerifiedAtAndResetEmailCode).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
    it('should throw 500 HttpException if any error occurs', async () => {
      (mockManagersModel.getManagerEntityByID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.inputValueNotInDB,
            `Error occurred while attempting to verify manager. Refer to the logs for more detail.`,
          ),
        );
      });

      try {
        await managersService.verifyManager(verifyRequest.managerID, verifyRequest.verificationCode);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByID).toHaveBeenCalledWith(verifyRequest.managerID);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockManagersModel.setVerifiedAtAndResetEmailCode).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
  });
  describe('resendEmail', () => {
    const resendEmailRequest = {
      email: 'johnsmithOnboardingResendEmail@gmail.com',
    };
    const mockManagerResponseNotVerified = {
      id: 1,
      first_name: 'dummy first',
      last_name: 'dummy last',
      email_code: 'hashed_email_code',
      verified_at: null,
    };
    const mockManagerResponseVerified = {
      id: 2,
      first_name: 'dummy first',
      last_name: 'dummy last',
      email_code: 'hashed_email_code',
      verified_at: '2022-01-01T00:00:00Z',
    };
    it('should successfully update email_code for user', async () => {
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponseNotVerified);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await managersService.resendEmail(resendEmailRequest.email);

      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(resendEmailRequest.email);
      expect(generateRandomPassword).toHaveBeenCalledTimes(1);
      expect(generatePasswordHash).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should not update email_code for user since user is already verified', async () => {
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerResponseVerified);
      const transaction = jest.fn();

      await managersService.resendEmail(resendEmailRequest.email);

      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(resendEmailRequest.email);
      expect(generateRandomPassword).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw 401 and not update email_code for user since user does not exist by email', async () => {
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      const transaction = jest.fn();

      try {
        await managersService.resendEmail(resendEmailRequest.email);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(resendEmailRequest.email);
      expect(generateRandomPassword).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw 500 error for any HttpException', async () => {
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      const transaction = jest.fn();

      try {
        await managersService.resendEmail(resendEmailRequest.email);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerEntityByEmail).toHaveBeenCalledWith(resendEmailRequest.email);
      expect(generateRandomPassword).not.toHaveBeenCalled();
      expect(generatePasswordHash).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    });
  });
  describe('getManager', () => {
    const mockManagerModelResponse = {
      first_name: 'Manager',
      last_name: 'Test',
      email: 'manager.test@taptab.com',
      phone: '8881231234',
      position_title_id: {
        id: 6,
        name: 'Manager',
      },
    };
    const expectedResponse = {
      firstName: 'Manager',
      lastName: 'Test',
      email: 'manager.test@taptab.com',
      phone: '8881231234',
      title: {
        titleID: 6,
        name: 'Manager',
      },
    };
    const MANAGER_ID = 1;
    it('should successfully get manager and position of manager with managerID', async () => {
      (mockManagersModel.getManagerAndTitleByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerModelResponse);

      const result = await managersService.getManager(2);

      expect(mockManagersModel.getManagerAndTitleByID).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw 404 if manager does not exist by managerID', async () => {
      (mockManagersModel.getManagerAndTitleByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await managersService.getManager(MANAGER_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerAndTitleByID).toHaveBeenCalledWith(MANAGER_ID);
    });
    it('should throw 500 if any runtime error occurs', async () => {
      (mockManagersModel.getManagerAndTitleByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managersService.getManager(MANAGER_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerAndTitleByID).toHaveBeenCalledWith(MANAGER_ID);
    });
  });
  describe('getManagerByStripeCustomerIDOrEmail', () => {
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    const EMAIL = 'test@email.com';
    const mockManagerModelResponse = {
      first_name: 'Manager',
      last_name: 'Test',
      email: 'manager.test@taptab.com',
      phone: '8881231234',
      position_title_id: {
        id: 6,
        name: 'Manager',
      },
      stripe_customer_id: STRIPE_CUSTOMER_ID,
    };
    it('should successfully get manager by stripeCustomerID', async () => {
      (mockManagersModel.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockManagerModelResponse);

      const result = await managersService.getManagerByStripeCustomerIDOrEmail(STRIPE_CUSTOMER_ID, EMAIL);

      expect(mockManagersModel.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, EMAIL);
      expect(result).toEqual(mockManagerModelResponse);
    });
    it('should throw 500 if any runtime error occurs while getting manager by stripeCustomerID', async () => {
      (mockManagersModel.getManagerByStripeCustomerIDOrEmail as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await managersService.getManagerByStripeCustomerIDOrEmail(STRIPE_CUSTOMER_ID, EMAIL);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockManagersModel.getManagerByStripeCustomerIDOrEmail).toHaveBeenCalledWith(STRIPE_CUSTOMER_ID, EMAIL);
    });
  });
  describe('editManagerInfoByID', () => {
    const MANAGER_ID = 1;
    const editInfoRequest: ManagerEditInfoRequestInterface = {
      firstName: 'first name',
      lastName: 'last name',
      email: 'test@gmail.com',
      phone: '7182129179',
    };
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';
    it('should successfully edit manager info', async () => {
      const editInfoEntity: ManagerEntity = {
        first_name: 'first name',
        last_name: 'last name',
        email: 'test@gmail.com',
        phone: '7182129179',
        id: MANAGER_ID,
      };
      const mockEmailResponse: ManagerEntity = {
        first_name: 'Test2',
        last_name: 'last name',
        email: 'test@gmail.com',
        phone: '7183218789',
        id: MANAGER_ID,
        stripe_customer_id: 'stripe customer id',
      };
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockEmailResponse);

      await managersService.editManagerInfoByID(MANAGER_ID, STRIPE_CUSTOMER_ID, editInfoRequest);

      expect(mockManagersModel.updateManagerInfoByID).toHaveBeenCalledWith(editInfoEntity);
    });
    it('should throw 409 HttpException if email belongs to other manager already', async () => {
      const mockEmailResponse: ManagerEntity = {
        first_name: 'Test2',
        last_name: 'last name',
        email: 'test@gmail.com',
        phone: '7183218789',
        id: 11,
      };
      (mockManagersModel.getManagerEntityByEmail as jest.MockedFunction<any>).mockResolvedValueOnce(mockEmailResponse);

      try {
        await managersService.editManagerInfoByID(MANAGER_ID, null, editInfoRequest);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
      expect(mockManagersModel.updateManagerInfoByID).not.toHaveBeenCalled();
    });
    it('should throw 500 HttpException if any error occurs', async () => {
      (mockManagersModel.updateManagerInfoByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await managersService.editManagerInfoByID(MANAGER_ID, null, editInfoRequest);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
