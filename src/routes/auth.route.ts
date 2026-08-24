import { Router } from 'express';
import RouteInterface from '@interfaces/routes.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import { CreateUserDto, ForgetPasswordDto, ResetPasswordDto } from '@/dtos/auth.dto';
import { AuthControllerInterface } from '@/interfaces/auth.interface';
import { ManagersControllerInterface } from '@/interfaces/managers.interface';
import { SignupManagerDto, VerifyManagerDto, ResendEmailDto } from '@/dtos/managers.dto';

class AuthRoute implements RouteInterface {
  public path = '/';
  public router = Router();
  private authController: AuthControllerInterface;
  private managerController: ManagersControllerInterface;

  constructor(authController: AuthControllerInterface, managerController: ManagersControllerInterface) {
    this.authController = authController;
    this.managerController = managerController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}login`, validationMiddleware(CreateUserDto, `body`), this.authController.authenticateLogin);
    this.router.post(`${this.path}forgotPassword`, validationMiddleware(ForgetPasswordDto, `body`), this.managerController.forgotPassword);
    this.router.post(`${this.path}resetPassword`, validationMiddleware(ResetPasswordDto, `body`), this.managerController.resetPassword);
    this.router.post(`${this.path}resendEmail`, validationMiddleware(ResendEmailDto, `body`), this.managerController.resendEmail);
    this.router.post(`${this.path}signUp`, validationMiddleware(SignupManagerDto, `body`), this.managerController.signupManager);
    this.router.put(`${this.path}verify`, validationMiddleware(VerifyManagerDto, `body`), this.managerController.verifyManager);
  }
}

export default AuthRoute;
