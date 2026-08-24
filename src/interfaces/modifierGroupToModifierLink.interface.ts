import { EntityManager } from 'typeorm';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';

export interface ModifierGroupToModifierLinkInterface {
  modifierGroupToModifierLinkID?: number;
  modifierGroupID: number;
  modifierID: number;
  listOrder: number;
  modifierGroup?: ModifierGroupEntity;
}

export interface ModifierGroupToModifierLinkModelInterface {
  insertModifierGroupToModifierLinks: (links: ModifierGroupToModifierLinkInterface[], entityManager?: EntityManager) => Promise<void>;
  deleteModifierGroupsLinkedByModifierID: (modifierID: number, entityManager?: EntityManager) => Promise<void>;
  fetchModifierGroupLinksByModifierID: (modifierID: number, entityManager?: EntityManager) => Promise<ModifierGroupToModifierLinkInterface[]>;
}
