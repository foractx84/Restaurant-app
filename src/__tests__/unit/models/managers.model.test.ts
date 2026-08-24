import {
  CreateManagerDBInterface,
  CreateManagerInterface,
  CreateManagerToRestaurantLinkInterface,
  ManagerDBInterface,
} from '@/interfaces/managers.interface';
import ManagersModel from '@/models/managers.model';
import { rawQuery, ormConnection } from '@/utils/dbUtils';
import { HttpException, TapManagerError } from '@/exceptions/HttpException';
import { ManagerEntity } from '@/entities/manager.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
    rawQuery: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const managerModel = new ManagersModel();
describe('managersModel', () => {
  afterEach(() => {
    (rawQuery as jest.MockedFunction<any>).mockReset();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('createManager', () => {
    it('should successfully return the newly created manager ID', async () => {
      const expectedResponse: CreateManagerDBInterface = { id: 15 };

      const mockedInsert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        getCustomRepository: () => ({
          insert: mockedInsert,
        }),
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);

      const manager: CreateManagerInterface = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: '',
        titleID: 1,
      };
      const result = await managerModel.createManager(manager);
      expect(mockedInsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error because a database error occurred', async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert: mockInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      const manager: CreateManagerInterface = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@smith.com',
        phone: '1112220000',
        pwd: '',
        titleID: 1,
      };
      try {
        await managerModel.createManager(manager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('createManagerLink', () => {
    const managerToRestaurantLink: CreateManagerToRestaurantLinkInterface = {
      externalUserID: 1,
      restaurantID: 1,
    };
    it('should successfully return nothing', async () => {
      const mockedInsert = jest.fn().mockResolvedValue(undefined);
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      const result = await managerModel.createManagerToRestaurantLink(managerToRestaurantLink);
      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(mockedInsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(undefined);
    });
    it('should not successfully return nothing because a database error occurred', async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert: mockInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      try {
        await managerModel.createManagerToRestaurantLink(managerToRestaurantLink);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('createManagerEntity', () => {
    const newManager: ManagerDBInterface = {
      first_name: 'Joe',
      last_name: 'Test',
      email: 'fake@email.com',
      phone: '1112223333',
      pwd: 'abcdefg12345',
      email_code: '12345abcdefg',
      position_title_id: 6,
    };

    const expectedResponse = {
      id: 1,
      first_name: 'Joe',
      last_name: 'Test',
      email: 'fake@email.com',
      phone: '1112223333',
      pwd: 'abcdefg12345',
      email_code: '12345abcdefg',
      position_title_id: 6,
    };
    it('should successfully return the newly created manager', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        insert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      const result = await managerModel.createManagerEntity(newManager);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should not return a manager ID because a database error occurred', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });
      try {
        await expect(managerModel.createManagerEntity(newManager)).rejects.toThrow();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getManagerEntityByEmail', () => {
    const email = 'manager@fake.com';
    it('should successfully get manager entity by email', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await managerModel.getManagerEntityByEmail(email);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await managerModel.getManagerEntityByEmail(email);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getManagerByStripeCustomerIDOrEmail', () => {
    const STRIPE_CUSTOMER_ID = 'stripe customer id';
    const EMAIL = 'test@email.com';
    it('should successfully get manager entity by stripe customer id', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await managerModel.getManagerByStripeCustomerIDOrEmail(STRIPE_CUSTOMER_ID, EMAIL);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs while getting manager entity by stripe customer id', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await managerModel.getManagerByStripeCustomerIDOrEmail(STRIPE_CUSTOMER_ID, EMAIL);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateManagerPasswordByID', () => {
    const managerID = 1;
    const tempPassword = 'drowssap';
    it("should successfully update manager's password ", async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await managerModel.updateManagerPasswordByID(managerID, tempPassword);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const update = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await managerModel.updateManagerPasswordByID(managerID, tempPassword);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getManagerEntityByID', () => {
    const managerID = 1;
    it('should successfully get manager entity by id', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await managerModel.getManagerEntityByID(managerID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await managerModel.getManagerEntityByID(managerID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('setVerifiedAtAndResetEmailCode', () => {
    const managerID = 1;
    it('should successfully set verified_at to timestamp and reset email code to null for manager entity by id', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await managerModel.setVerifiedAtAndResetEmailCode(managerID);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const update = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await managerModel.setVerifiedAtAndResetEmailCode(managerID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateManagerEmailCode', () => {
    const managerID = 1;
    const email = 'johnsmithOnboardingUpdateEmailCode@gmail.com';
    it('should successfully set email_code to hashed value', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await managerModel.updateManagerEmailCode(managerID, email);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const update = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await managerModel.updateManagerEmailCode(managerID, email);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getManagerAndTitleByID', () => {
    const MANAGER_ID = 1;
    it('should get manager and position title via managerID', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await managerModel.getManagerAndTitleByID(MANAGER_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await managerModel.getManagerAndTitleByID(MANAGER_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateManagerInfoByID', () => {
    const managerEntity: ManagerEntity = {
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'test@gmail.com',
      id: 1000,
      phone: '7182367719',
    };
    it('should update manager info via managerID', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await managerModel.updateManagerInfoByID(managerEntity);

      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs', async () => {
      const mockedSave = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      try {
        await managerModel.updateManagerInfoByID(managerEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
  });
});
