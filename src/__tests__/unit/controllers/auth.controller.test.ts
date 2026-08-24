import AuthController from '@/controllers/auth.controller';
import { AuthModelsInterface } from '@/interfaces/auth.interface';
import AuthService from '@/services/auth.service';
import { Request, Response, NextFunction } from 'express';

// mock the auth service
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    authenticateLogin: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});

// mock auth service object
const mockAuthService = new AuthService({} as AuthModelsInterface);
// create test controller object
const authController = new AuthController(mockAuthService);

// unit testing
describe('authController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('authenticateLogin', () => {
    const TOKEN = 'token';
    it('should successfully authorize user', async () => {
      // mock the required response for the test
      const mockServiceResponse = { TOKEN };
      // set up mock auth service to return our mock response to controller
      (mockAuthService.authenticateLogin as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);
      // mock a request needed by controller
      const mReq = {
        body: {
          email: 'email@test.com',
          password: 'password',
        },
      };
      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };
      // call on controller as the router would
      await authController.authenticateLogin(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockAuthService.authenticateLogin).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(mockServiceResponse);
    });

    it('should return an error when an issue occurs while authorizing user', async () => {
      // mock a request needed by controller
      const mReq = undefined;
      const mNext = jest.fn();
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      // call on controller as the router would
      await authController.authenticateLogin(mReq as Request, mRes as Response, mNext as NextFunction);
      // enforce test expectations
      expect(mockAuthService.authenticateLogin).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalledTimes(1);
    });
  });
});
