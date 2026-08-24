import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import { TitlesControllerInterface } from '@interfaces/titles.interface';

class TitlesRoute implements Route {
  public path = '/titles';
  public router = Router();
  private titlesController: TitlesControllerInterface;

  constructor(titlesController: TitlesControllerInterface) {
    this.titlesController = titlesController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.titlesController.getTitles);
  }
}

export default TitlesRoute;
