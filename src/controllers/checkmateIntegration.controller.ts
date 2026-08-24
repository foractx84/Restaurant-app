import { NextFunction, Request, Response } from 'express';
import { CheckmateControllerInterface, CheckmateIntegrationServiceInterface, CheckmateEvent } from '@interfaces/checkmateIntegration.interface';
import { logger } from '@utils/logger';

class CheckmateIntegrationController implements CheckmateControllerInterface {
  private checkmateIntegrationService: CheckmateIntegrationServiceInterface;

  constructor(modifierService: CheckmateIntegrationServiceInterface) {
    this.checkmateIntegrationService = modifierService;
  }

  initWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as CheckmateEvent;

      this.checkmateIntegrationService.handleCheckmateEvent(payload).catch(err => {
        logger.error(`Error processing Checkmate webhook event: ${err}`);
      });

      res.status(200).end();
    } catch (err) {
      logger.error(`Webhook Error: ${err.message}`);
      res.status(200).end();
    }
  };

  oAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query.code as string;

      if (!code) {
        res.status(400).json({ error: 'Missing code parameter' });
      }

      await this.checkmateIntegrationService.handleOAuthWithAuthCode(code);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default CheckmateIntegrationController;
