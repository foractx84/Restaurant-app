import {
  ManagersControllerInterface,
  ManagersServiceInterface,
  CreateManagerInterface,
  ManagerUpdatePasswordRequestInterface,
  VerifyManagerRequestInterface,
  GetManagerInterface,
  ResendEmailRequestInterface,
  ManagerEditInfoRequestInterface,
} from '@/interfaces/managers.interface';
import { Response, Request, NextFunction } from 'express-serve-static-core';
import { ForgetPasswordInterface, ResetPasswordInterface } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';

class ManagersController implements ManagersControllerInterface {
  private managersService: ManagersServiceInterface;

  constructor(managersService: ManagersServiceInterface) {
    this.managersService = managersService;
  }

  createManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!res.locals.isSuper) {
        logger.error(`User is unauthorized to create manager`);
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser, `User is unauthorized to create manager`));
      }
      const manager = req.body as CreateManagerInterface;
      manager.titleName = manager.titleName || 'Manager'; // what I found works for default value on req.body
      await this.managersService.createManager(manager);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = (req.body as ForgetPasswordInterface)?.email;
      await this.managersService.forgotPassword(email);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  getManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const managerID = parseInt(res.locals.managerID);
      const result: GetManagerInterface = await this.managersService.getManager(managerID);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  resendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const manager: ResendEmailRequestInterface = req.body as ResendEmailRequestInterface;
      await this.managersService.resendEmail(manager.email);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const manager = req.body as ResetPasswordInterface;
      const { email, tempPassword, newPassword } = manager;
      const result = await this.managersService.resetPassword(email, tempPassword, newPassword);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  signupManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const manager = req.body as CreateManagerInterface;
      const token = await this.managersService.signupManager(manager);
      if (manager.stripeCustomerID) {
        res.json(token);
      } else {
        res.sendStatus(200);
      }
    } catch (err) {
      next(err);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const manager = req.body as ManagerUpdatePasswordRequestInterface;
      const { currentPassword, newPassword } = manager;
      const managerID = parseInt(res.locals.managerID) || 0;
      await this.managersService.updatePassword(managerID, currentPassword, newPassword);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  verifyManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { managerID, verificationCode } = req.body as VerifyManagerRequestInterface;
      const result = await this.managersService.verifyManager(managerID, verificationCode);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  editManagerInfoByID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const managerInfo = req.body as ManagerEditInfoRequestInterface;
      const managerID = parseInt(res.locals.managerID);
      await this.managersService.editManagerInfoByID(managerID, res.locals.stripeCustomerID, managerInfo);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default ManagersController;
