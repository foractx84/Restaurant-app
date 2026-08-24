import authorizationMiddleware from '@/middlewares/authorization.middleware';
import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import AuthService from '@/services/auth.service';
import jwt from 'jsonwebtoken';
import { AuthModelsInterface } from '@/interfaces/auth.interface';

// mock dependencies - isolate middleware
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
    validateSuperUser: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/util', () => {
  return { __esModule: true };
});
jest.mock('@/configs/config', () => {
  return { __esModule: true, JWT: {} };
});
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/exceptions/HttpException', () => {
  return { __esModule: true, getErrorPayload: jest.fn(), HttpException: Error, InternalErrorCode: jest.fn() };
});
// mock service object
const mockAuthService = new AuthService({} as AuthModelsInterface);

// unit testing
describe('authorizationMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks(); // changed to clear all mocks and it works
  });
  describe('authorizationMiddleware', () => {
    it('should successfully decrypt JWT token for special_users (super user)', async () => {
      // set up responses from external functions used
      const decoded = {
        managerID: 1,
        superUser: true,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      // mock a request needed by middleware
      const mReq: Partial<Request> = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'token',
          restaurantid: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { isSuper: true, managerID: 1 },
      };
      const mNext = jest.fn();

      // call on middleware as the router would
      const result = await new Promise(resolve => {
        authorizationMiddleware(
          mReq as Request,
          mRes as Response,
          mNext.mockImplementation(err => {
            if (!err) {
              resolve(mRes.locals);
            }
          }),
        );
      });
      expect(result).toEqual({ managerID: 1, restaurantID: '1', isSuper: true });
      expect(mNext).toHaveBeenCalledTimes(1);
    });
    it('should throw 401 Unauthorized if authorization if validateSuperUser returns false', async () => {
      // set up responses from external functions used
      const decoded = {
        managerID: 1,
        superUser: true,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateSuperUser as jest.MockedFunction<any>).mockResolvedValueOnce(false);

      // mock a request needed by middleware
      const mReq: Partial<Request> = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'token',
          restaurantid: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: {},
      };
      const mNext = jest.fn();

      (mNext as jest.MockedFunction<any>).mockImplementationOnce(err => {
        expect(err.status).toEqual(401);
      });
      await authorizationMiddleware(mReq as Request, mRes as Response, jest.fn() as NextFunction);
    });
    it('should successfully decrypt JWT token for regular external manager', async () => {
      // set up responses from external functions used
      const decoded = {
        managerID: 1,
        superUser: false,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      // mock a request needed by middleware
      const mReq: Partial<Request> = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'token',
          restaurantid: '1',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { isSuper: false, managerID: 1 },
      };
      const mNext = jest.fn();

      // call on middleware as the router would
      const result = await new Promise(resolve => {
        authorizationMiddleware(
          mReq as Request,
          mRes as Response,
          mNext.mockImplementation(err => {
            if (!err) {
              resolve(mRes.locals);
            }
          }),
        );
      });
      expect(result).toEqual({ managerID: 1, restaurantID: '1', isSuper: false });
      expect(mNext).toHaveBeenCalledTimes(1);
    });
    it('should throw 401 Unauthorized if authorization token is not included in headers', () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          name: 'test',
        },
        headers: {},
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };

      // call on middleware as the router would
      expect(() => {
        authorizationMiddleware(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      }).toThrow(HttpException);
    });

    it('should throw 401 Unauthorized if restaurantid is not included in headers', () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'token',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };

      // call on middleware as the router would
      expect(() => {
        authorizationMiddleware(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      }).toThrow(HttpException);
    });
  });
});
