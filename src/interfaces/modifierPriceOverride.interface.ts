import { EntityManager } from 'typeorm';
import { ModifierPriceOverrideEntity } from '@entities/modifierPriceOverride.entity';

export interface ModifierPriceOverrideInterface {
  id?: number;
  modifierID: number;
  externalParty: string;
  ruleType: string;
  ruleValue: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ModifierPriceOverrideModelInterface {
  createModifierPriceOverride: (override: ModifierPriceOverrideEntity, entityManager?: EntityManager) => Promise<ModifierPriceOverrideEntity>;
  fetchModifierPriceOverridesByModifierID: (modifierID: number, entityManager?: EntityManager) => Promise<ModifierPriceOverrideEntity[]>;
  softDeleteModifierPriceOverridesByModifierID: (modifierID: number, entityManager?: EntityManager) => Promise<void>;
}
