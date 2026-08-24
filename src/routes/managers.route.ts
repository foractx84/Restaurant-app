import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { ManagersControllerInterface } from '@/interfaces/managers.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { CreateManagerDto, ManagerUpdatePasswordDto } from '@/dtos/managers.dto';
import parseTokenMiddleware from '@middlewares/parseToken.middleware';

class ManagersRoute implements Route {
  public path = '/managers';
  public router = Router();
  private managersController: ManagersControllerInterface;

  constructor(managersController: ManagersControllerInterface) {
    this.managersController = managersController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', parseTokenMiddleware, validationMiddleware(CreateManagerDto, 'body'), this.managersController.createManager);
    this.router.put(
      '/password',
      parseTokenMiddleware,
      validationMiddleware(ManagerUpdatePasswordDto, 'body'),
      this.managersController.updatePassword,
    );
  }
}

export default ManagersRoute;
