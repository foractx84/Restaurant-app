import Route from '@interfaces/routes.interface';
import { Router } from 'express';
import { FontsControllerInterface } from '@/interfaces/fonts.interface';
import parseTokenMiddleware from '@middlewares/parseToken.middleware';

class FontsRoute implements Route {
  public path = '/fonts';
  public router = Router();

  private fontsController: FontsControllerInterface;

  constructor(fontsController: FontsControllerInterface) {
    this.fontsController = fontsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', parseTokenMiddleware, this.fontsController.getFonts);
  }
}

export default FontsRoute;
