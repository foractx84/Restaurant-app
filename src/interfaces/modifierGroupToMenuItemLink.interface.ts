import { ModifierGroupEntity } from '@entities/modifierGroup.entity';

export interface ModifierGroupToMenuItemLinkInterface {
  modifierGroupToMenuItemLinkID?: number;
  modifierGroupID: number;
  menuItemID: number;
  listOrder: number;
  modifierGroup?: ModifierGroupEntity;
}
