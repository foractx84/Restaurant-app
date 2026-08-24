import { NextFunction, Request, Response } from 'express';
import { Job } from 'pg-boss';

export interface CheckmateControllerInterface {
  initWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  oAuthCallback: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface CheckmateIntegrationServiceInterface {
  handleCheckmateEvent: (event: CheckmateEvent) => Promise<void>;
  handleOAuthWithAuthCode: (authCode: string) => Promise<void>;
  processCheckmateJob: (job: Job<CheckmateJob>[]) => Promise<void>;
}

export interface CheckmateJob {
  locationID: number;
  restaurantID: number;
}

export interface CheckmateEvent {
  location_id: number;
}
