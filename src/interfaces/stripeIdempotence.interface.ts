import { StripeIdempotenceEventEntity } from '@/entities/stripeIdempotenceEvent.entity';
import { EntityManager } from 'typeorm';

export interface StripeIdempotenceServiceInterface {
  checkStripeEventExists: (eventID: string) => Promise<boolean>;
  logStripeEvent: (eventID: string) => Promise<void>;
}

export interface StripeIdempotenceModelInterface {
  getStripeEventByEventID: (eventID: string, repository?: EntityManager) => Promise<StripeIdempotenceEventEntity>;
  insertStripeEvent: (eventID: string, repository?: EntityManager) => Promise<void>;
}
