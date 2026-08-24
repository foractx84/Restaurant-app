import { APP_CONFIG } from '@/configs/config';
import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = {
        app: 'TapTab SuperBackend',
        version: APP_CONFIG.API_VERSION,
        build: APP_CONFIG.API_BUILD,
      };
      res.send(data);
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
