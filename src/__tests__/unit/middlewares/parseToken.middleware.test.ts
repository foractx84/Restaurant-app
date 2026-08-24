import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import parseTokenMiddleware from '@middlewares/parseToken.middleware';
import AuthService from '@/services/auth.service';
import { AuthModelsInterface } from '@/interfaces/auth.interface';

// mock dependencies - isolate middleware
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateSuperUser: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/util', () => {
  return { __esModule: true };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    JWT: {},
  };
});
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});

const mockAuthService = new AuthService({} as AuthModelsInterface);

describe('parseTokenMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks(); // changed to clear all mocks and it works
  });
  describe('parseTokenMiddleware', () => {
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
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { isSuper: true, managerID: 1 },
      };
      const mNext = jest.fn();

      // call on middleware as the router would
      await new Promise(resolve => {
        parseTokenMiddleware(
          mReq as Request,
          mRes as Response,
          mNext.mockImplementation(err => {
            if (!err) {
              expect(mRes.locals.managerID).toEqual(1);
              resolve(mRes.locals);
            }
          }),
        );
      });
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
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();
      (mNext as jest.MockedFunction<any>).mockImplementationOnce(err => {
        expect(err.status).toEqual(401);
      });

      await parseTokenMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    });
    it('should successfully decrypt JWT token and store manager ID in res locals', async () => {
      // set up responses from external functions used
      const decoded = {
        managerID: 1,
        superUser: false,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      // mock a request needed by middleware
      const mReq: Partial<Request> = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'token',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { isSuper: false, managerID: 1 },
      };
      const mNext = jest.fn();

      // call on middleware as the router would
      await new Promise(resolve => {
        parseTokenMiddleware(
          mReq as Request,
          mRes as Response,
          mNext.mockImplementation(err => {
            if (!err) {
              expect(mRes.locals.managerID).toEqual(1);
              resolve(mRes.locals);
            }
          }),
        );
      });
      expect(mNext).toHaveBeenCalledTimes(1);
    });
    it('should successfully decrypt JWT token and store manager ID in res locals if token starts with "Bearer"', async () => {
      // set up responses from external functions used
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      // mock a request needed by middleware
      const mReq: Partial<Request> = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'Bearer token',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: {},
      };
      const mNext = jest.fn();

      // call on middleware as the router would
      await new Promise(resolve => {
        parseTokenMiddleware(
          mReq as Request,
          mRes as Response,
          mNext.mockImplementation(err => {
            if (!err) {
              expect(mRes.locals.managerID).toEqual(1);
              resolve(mRes.locals);
            }
          }),
        );
      });
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
        parseTokenMiddleware(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      }).toThrow(HttpException);
    });
    it('should return status of 401 if token fails to verify', async () => {
      // set up responses from external functions used
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback({}, decoded);
      });
      // mock a request needed by middleware
      const mReq: Partial<Request> = {
        body: {
          name: 'test',
        },
        headers: {
          authorization: 'Bearer token',
        },
      };
      const mRes: Partial<Response> = {
        json: jest.fn(),
        status: function (responseStatus) {
          expect(responseStatus).toEqual(401);
          // This next line makes it chainable
          return this;
        },
        locals: {},
      };
      const mNext = jest.fn();

      // call on middleware as the router would
      parseTokenMiddleware(mReq as Request, mRes as Response, mNext as NextFunction);
    });
  });
});
