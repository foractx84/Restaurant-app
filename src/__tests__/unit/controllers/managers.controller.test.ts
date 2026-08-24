import ManagersController from '@/controllers/managers.controller';
import { ManagersModelsInterface } from '@/interfaces/managers.interface';
import TitlesModel from '@/models/titles.model';
import ManagersService from '@/services/managers.service';
import RestaurantsService from '@/services/restaurants.service';
import { Request, Response, NextFunction } from 'express';

// mock the managers service
jest.mock('@/services/managers.service', () => {
  const mockManagersService = {
    createManager: jest.fn(),
    signupManager: jest.fn(),
    getManager: jest.fn(),
    resetPassword: jest.fn(),
    forgotPassword: jest.fn(),
    resendEmail: jest.fn(),
    updatePassword: jest.fn(),
    verifyManager: jest.fn(),
    editManagerInfoByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagersService) };
});

// mock managers service object
const mockManagersService = new ManagersService({} as ManagersModelsInterface, {} as TitlesModel, {} as RestaurantsService);
// create test controller object
const managersController = new ManagersController(mockManagersService);

// unit testing
describe('managersController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createManager', () => {
    it('should successfully create manager', async () => {
      // mock a request needed by controller
      const mReq = { body: {} };
      // mock a response object for controller to return into
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { isSuper: true },
      };
      // call on controller as the router would
      await managersController.createManager(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.createManager).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not create manager because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.createManager(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.createManager).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
    it('should not create manager due to isSuper = false (not super user) ', async () => {
      // mock a request needed by controller
      const mReq = { body: {} };
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn(),
        locals: { isSuper: false },
      };
      const mNext = jest.fn();

      // call on controller as the router would
      await managersController.createManager(mReq as Request, mRes as Response, mNext as NextFunction);
      // enforce test expectations
      expect(mockManagersService.createManager).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('signupManager', () => {
    it('should successfully sign up manager when stripe customer id is provided', async () => {
      const TOKEN = 'token';
      const mockManager = {
        firstName: 'Joe',
        lastName: 'Person',
        email: 'fake@email.edu',
        phone: '1112223333',
        pwd: 'Password1@',
        titleName: 'Manager',
        stripeCustomerID: 'stripe_customer_id',
      };
      // mock a request needed by controller
      const mReq = { body: mockManager };
      // mock a response object for controller to return into
      let result = '';
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(v => (result = v)),
      };
      (mockManagersService.signupManager as jest.MockedFunction<any>).mockResolvedValueOnce(TOKEN);

      // call on controller as the router would
      await managersController.signupManager(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.signupManager).toHaveBeenCalledWith(mockManager);
      expect(result).toEqual(TOKEN);
    });
    it('should successfully create manager through onboarding app flow', async () => {
      const mockManager = {
        firstName: 'Joe',
        lastName: 'Person',
        email: 'fake@email.edu',
        phone: '1112223333',
        pwd: 'Password1@',
        titleName: 'Manager',
      };
      // mock a request needed by controller
      const mReq = { body: mockManager };
      // mock a response object for controller to return into
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
      };
      (mockManagersService.signupManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      // call on controller as the router would
      await managersController.signupManager(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.signupManager).toHaveBeenCalledWith(mockManager);
      expect(status).toEqual(200);
    });
    it('should not create manager onboarding because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.signupManager(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.signupManager).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('resetPassword', () => {
    it('should successfully set new password for manager', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          email: 'test@fake.com',
          tempPassword: 'password',
          newPassword: 'new_password',
        },
      };
      // mock a response object for controller to return into
      let responseObject;
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        // locals: { restaurantID: 1 },
      };

      const mockResponse = {
        token: 'random_token_string',
      };
      (mockManagersService.resetPassword as jest.MockedFunction<any>).mockResolvedValueOnce(mockResponse);

      // call on controller as the router would
      await managersController.resetPassword(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.resetPassword).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockResponse);
    });
    it('should not set new password because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.resetPassword(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.resetPassword).not.toHaveBeenCalled();
    });
  });
  describe('forgotPassword', () => {
    it('should successfully reset manager password', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          email: 'manager@fake.com',
        },
      };
      // mock a response object for controller to return into
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
      };
      // call on controller as the router would
      await managersController.forgotPassword(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.forgotPassword).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not reset manager password because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.forgotPassword(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.forgotPassword).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('updatePassword', () => {
    it('should successfully update manager password', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          email: 'manager@fake.com',
          password: 'New_password3!',
        },
      };
      // mock a response object for controller to return into
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: {
          managerID: 1,
        },
      };
      (mockManagersService.updatePassword as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      // call on controller as the router would
      await managersController.updatePassword(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.updatePassword).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not update manager password because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.updatePassword(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.updatePassword).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('verifyManager', () => {
    const TOKEN = 'token';
    it('should successfully verify manager', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          managerID: 1,
          verificationCode: 'New_password3!',
        },
      };

      // mock the required response for the test
      const mockServiceResponse = { TOKEN };
      // set up mock manager service to return our mock response to controller
      (mockManagersService.verifyManager as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);
      // mock a request needed by controller

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      // call on controller as the router would
      await managersController.verifyManager(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.verifyManager).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not verify manager because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.verifyManager(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.verifyManager).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('resendEmail', () => {
    it('should successfully resend email manager and update email code', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          email: 'johnsmithOnboardingResendEmail@gmail.com',
        },
      };

      // set up mock manager service to return our mock response to controller
      (mockManagersService.resendEmail as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      // mock a request needed by controller

      // mock a response object for controller to return into
      let status = 0;
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
      };

      // call on controller as the router would
      await managersController.resendEmail(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.resendEmail).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not update email_code and resend email to manager because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.resendEmail(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.resendEmail).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getManager', () => {
    it('should successfully get manager info and title', async () => {
      // mock a request needed by controller
      const mReq = {};

      // mock the required response for the test
      const mockServiceResponse = {
        firstName: 'Manager',
        lastName: 'Test',
        email: 'manager.test@taptab.com',
        phone: '8881231234',
        title: {
          titleID: 6,
          name: 'Manager',
        },
      };
      // set up mock manager service to return our mock response to controller
      (mockManagersService.getManager as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);
      // mock a request needed by controller

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: 1000 },
      };

      // call on controller as the router would
      await managersController.getManager(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockManagersService.getManager).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not get manager because invalid request', async () => {
      const mReq = undefined; // mock a request needed by controller
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.getManager(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.getManager).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editManagerInfoByID', () => {
    it('should successfully edit manager info', async () => {
      const mReq = {
        body: {
          firstName: 'first_name',
          lastName: 'last_name',
          email: 'test@gmail.com',
          phone: '7181234567',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { managerID: 1 },
      };
      await managersController.editManagerInfoByID(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockManagersService.editManagerInfoByID).toHaveBeenCalled();
    });
    it('should not edit manager info because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await managersController.editManagerInfoByID(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockManagersService.editManagerInfoByID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
