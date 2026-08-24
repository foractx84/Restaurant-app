import { UserInterface } from '@/interfaces/users.interface';
import { NextFunction, Request, Response } from 'express';
import { AuthControllerInterface, AuthServiceInterface } from '@/interfaces/auth.interface';
class AuthController implements AuthControllerInterface {
  private authService: AuthServiceInterface;

  constructor(authService: AuthServiceInterface) {
    this.authService = authService;
  }

  authenticateLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body as UserInterface;
      const result = await this.authService.authenticateLogin(userData);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export default AuthController;
