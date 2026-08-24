import { MenusServiceInterface } from '@interfaces/menus.interface';
import { MenuItemServiceInterface } from '@interfaces/menuItem.interface';
import { ModifierGroupServiceInterface } from '@interfaces/modifierGroup.interface';
import { MenuHoursServiceInterface } from '@interfaces/menuHours.interface';
import { ModifierServiceInterface } from '@interfaces/modifier.interface';
import { MenuDisclaimerServiceInterface } from '@interfaces/disclaimers.interface';
import { MenuSectionsServiceInterface } from '@interfaces/menuSections.interface';
import { IAtomicChange, Operation } from 'json-diff-ts';
import { MenuItemMediaServiceInterface } from '@interfaces/menuItemMedia.interface';
import { SoftDeleteServiceInterface } from '@interfaces/softDelete.interface';
import { ModifierToModifierGroupLinkServiceInterface } from '@interfaces/modifierToModifierGroupLink.interface';
import { MenuDetailsServiceInterface } from '@interfaces/menuDetails.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';

export interface MenuUpdateContext {
  menuService: MenusServiceInterface;
  menuDetailsService: MenuDetailsServiceInterface;
  menuSectionService: MenuSectionsServiceInterface;
  menuItemService: MenuItemServiceInterface;
  modifierGroupService: ModifierGroupServiceInterface;
  modifierService: ModifierServiceInterface;
  modifierToModifierGroupLinkService: ModifierToModifierGroupLinkServiceInterface;
  menuHoursService: MenuHoursServiceInterface;
  menuDisclaimerService: MenuDisclaimerServiceInterface;
  menuItemMediaService: MenuItemMediaServiceInterface;
  softDeleteService: SoftDeleteServiceInterface;
  restaurantService: RestaurantsServiceInterface;
}

interface OperationContext {
  locationId: number | null;
  restaurantId: number;
  menuId: string | undefined;
  sectionId: string | undefined;
  itemId: string | undefined;
  modifierGroupId: string | undefined;
  modifierId: string | undefined;
  day: string | null;
  index: number | undefined;
}

export type TapTabEntity = 'modifier' | 'modifierGroup' | 'itemImage' | 'item' | 'section' | 'hours' | 'menu';

export interface EnrichedOperation extends IAtomicSyncChange {
  id?: string;
  entity: TapTabEntity;
  context: OperationContext;
  keys: string[];
}

export type ExtendedOperation = Operation | 'SORT';

export interface IAtomicSyncChange extends Omit<IAtomicChange, 'type'> {
  type: ExtendedOperation;
}
