import { EntityManager } from 'typeorm';

export interface ModifierToModifierGroupLinkServiceInterface {
  deleteModifiersLinkedByModifierGroupID: (modifierGroupID: number, entityManager?: EntityManager) => Promise<void>;
  insertModifierToModifierGroupLinks: (
    modifierToModifierGroupLinks: ModifierToModifierGroupLinkInterface[],
    entityManager?: EntityManager,
  ) => Promise<void>;
}

export interface ModifierToModifierGroupLinkModelInterface {
  deleteModifiersLinkedByModifierGroupID: (modifierGroupID: number, entityManager?: EntityManager) => Promise<void>;
  insertModifierToModifierGroupLinks: (
    modifierToModifierGroupLinks: ModifierToModifierGroupLinkInterface[],
    entityManager?: EntityManager,
  ) => Promise<void>;
}

export interface ModifierToModifierGroupLinkInterface {
  modifierToModifierGroupLinkID?: number;
  modifierGroupID: number;
  modifierID: number;
  listOrder?: number;
}
