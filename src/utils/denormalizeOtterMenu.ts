import { GetMenuDetailsResponseInterface } from '@interfaces/menus.interface';
import { MenuHours } from '@interfaces/menuHours.interface';
import { GetMenuItemsByMenuSectionInterface } from '@interfaces/menuItem.interface';
import { OtterHourInterval, OtterHours, OtterMenusUpsertRequest, OtterMoney } from '@interfaces/otter.interface';

/** Selection-rule columns (TAB-425) not exposed by the existing menu-details read path; supplied separately. */
export interface OtterModifierGroupSelectionRules {
  minimumSelections?: number;
  maximumSelections?: number;
  maxPerModifierSelectionQuantity?: number;
}

export interface OtterMenuPushInput {
  menu: GetMenuDetailsResponseInterface;
  hours: MenuHours[];
}

const DEFAULT_CURRENCY_CODE = 'USD';

const centsToOtterMoney = (cents: number | undefined | null): OtterMoney => ({
  currencyCode: DEFAULT_CURRENCY_CODE,
  amount: Math.round(cents ?? 0) / 100,
});

const DAY_NAME_TO_OTTER_DAY: Record<string, OtterHourInterval['day']> = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
};

const parseHourAndMinute = (time: string): { hour: number; minute: number } => {
  const [hour, minute] = time.split(':').map(part => parseInt(part, 10));
  return { hour: hour || 0, minute: minute || 0 };
};

const menuHoursToOtterHours = (hours: MenuHours[]): OtterHours | undefined => {
  if (!hours?.length) {
    return undefined;
  }

  const intervals: OtterHourInterval[] = hours
    .map(hour => {
      const day = DAY_NAME_TO_OTTER_DAY[hour.day?.toUpperCase()];
      if (!day) {
        return null;
      }
      const from = parseHourAndMinute(hour.start);
      const to = parseHourAndMinute(hour.end);
      return { day, fromHour: from.hour, fromMinute: from.minute, toHour: to.hour, toMinute: to.minute };
    })
    .filter((interval): interval is OtterHourInterval => interval !== null);

  return intervals.length ? { intervals } : undefined;
};

const itemSaleStatus = (isHidden: boolean): 'FOR_SALE' | 'INDEFINITELY_NOT_FOR_SALE' => (isHidden ? 'INDEFINITELY_NOT_FOR_SALE' : 'FOR_SALE');

/**
 * Otter's `POST /v1/menus` is a full-replacement upsert keyed by `id` — pushing an entity under a
 * DIFFERENT id than the one Otter already knows it by doesn't update the existing entity, it creates
 * a duplicate. `externalID` is Otter's own id, set on pull (`normalizeOtterMenus`) for any entity
 * that originated on Otter's side. Only entities that have never round-tripped through Otter (created
 * natively in TapTab, never yet pushed) lack one — for those, TapTab's own internal id becomes their
 * Otter id going forward, same as before this fallback existed.
 */
const otterEntityId = (externalID: string | undefined, internalID: number | string): string => externalID ?? String(internalID);

/**
 * Builds the `POST /v1/menus` request body from TapTab's own menu data — the reverse of
 * `normalizeOtterMenus`. Otter's upsert is full-replacement, so every menu, category, item, and
 * modifier group that should remain must be included; this always sends the complete current state
 * for the restaurant, never a partial diff.
 *
 * v1 scope: base item size only (item size variants beyond the base size aren't represented — Otter
 * models one price per item), no photos, no price overrides, no SKU/dietary/allergen data, no nested
 * modifier groups. See Documentation/OTTER_FIELD_MAPPING.md.
 */
export function buildOtterMenusUpsertRequest(
  menus: OtterMenuPushInput[],
  modifierGroupSelectionRulesByID: Record<number, OtterModifierGroupSelectionRules>,
): OtterMenusUpsertRequest {
  const request: OtterMenusUpsertRequest = { menus: {}, categories: {}, modifierGroups: {}, items: {} };

  const addItem = (item: GetMenuItemsByMenuSectionInterface): void => {
    const id = otterEntityId(item.externalID, item.menuItemID);
    request.items[id] = {
      id,
      name: item.name,
      description: item.description ?? '',
      price: centsToOtterMoney(item.baseItemSize?.price),
      status: { saleStatus: itemSaleStatus(item.isHidden) },
      modifierGroupIds: (item.modifierGroups ?? []).map(group => otterEntityId(group.externalID, group.modifierGroupID)),
    };

    for (const group of item.modifierGroups ?? []) {
      const groupId = otterEntityId(group.externalID, group.modifierGroupID);
      const rules = modifierGroupSelectionRulesByID[group.modifierGroupID] ?? {};
      request.modifierGroups[groupId] = {
        id: groupId,
        name: group.name,
        itemIds: (group.modifiers ?? []).map(modifier => otterEntityId(modifier.externalID, modifier.modifierID)),
        minimumSelections: rules.minimumSelections,
        maximumSelections: rules.maximumSelections,
        maxPerModifierSelectionQuantity: rules.maxPerModifierSelectionQuantity,
      };

      for (const modifier of group.modifiers ?? []) {
        const modifierId = otterEntityId(modifier.externalID, modifier.modifierID);
        request.items[modifierId] = {
          id: modifierId,
          name: modifier.name,
          description: modifier.description ?? '',
          price: centsToOtterMoney(modifier.price),
          status: { saleStatus: itemSaleStatus(modifier.isHidden) },
        };
      }
    }
  };

  for (const { menu, hours } of menus) {
    const menuId = otterEntityId(menu.externalID, menu.menuID);
    const sections = menu.menuSections ?? [];

    request.menus[menuId] = {
      id: menuId,
      name: menu.menuName,
      categoryIds: sections.map(section => otterEntityId(section.externalID, section.menuSectionID)),
      hours: menuHoursToOtterHours(hours),
    };

    for (const section of sections) {
      const sectionId = otterEntityId(section.externalID, section.menuSectionID);
      request.categories[sectionId] = {
        id: sectionId,
        name: section.sectionName,
        itemIds: (section.items ?? []).map(item => otterEntityId(item.externalID, item.menuItemID)),
      };

      for (const item of section.items ?? []) {
        addItem(item);
      }
    }
  }

  return request;
}
