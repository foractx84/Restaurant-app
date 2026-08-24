import { StripeTaxEntity } from '@/entities/stripeTax.entity';
import { EntityManager } from 'typeorm';

export interface StripeTaxServiceInterface {
  getStripeTaxCodes: (repository?: EntityManager) => Promise<StripeTaxEntity[]>;
}

export interface StripeTaxModelInterface {
  getStripeTaxCodes: (repository?: EntityManager) => Promise<StripeTaxEntity[]>;
}

export interface StripeTaxDBInterface {
  tax_rate_id: number;
  stripe_tax_rate_id: string;
  state: string;
  country: string;
  created_at: string;
  updated_at: string;
}
