import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { ManagersControllerInterface } from '@/interfaces/managers.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { ManagerEditInfoDto } from '@/dtos/managers.dto';
import parseTokenMiddleware from '@middlewares/parseToken.middleware';
import getManagerStripeCustomerIDByManagerID from '@middlewares/getManagerStripeCustomerIDByManagerID.middleware';

class ManagerRoute implements Route {
  public path = '/manager';
  public router = Router();
  private managersController: ManagersControllerInterface;

  constructor(managersController: ManagersControllerInterface) {
    this.managersController = managersController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', parseTokenMiddleware, this.managersController.getManager);
    this.router.put(
      '/',
      parseTokenMiddleware,
      getManagerStripeCustomerIDByManagerID,
      validationMiddleware(ManagerEditInfoDto, 'body'),
      this.managersController.editManagerInfoByID,
    );
  }
}

export default ManagerRoute;
