import {
  NormalizedMenu,
  NormalizedMenuHour,
  NormalizedMenuHours,
  NormalizedMenuItem,
  NormalizedMenuSection,
  NormalizedModifier,
  NormalizedModifierGroup,
} from '@interfaces/platformIntegration.interface';
import {
  NormalizedMenuBuilder,
  NormalizedMenuHoursBuilder,
  NormalizedMenuItemBuilder,
  NormalizedMenuSectionBuilder,
  NormalizedModifierBuilder,
  NormalizedModifierGroupsBuilder,
} from '@/builders/normalizedMenu.builder';
import stableStringify from 'json-stable-stringify';
import {
  CheckmateMenu,
  CheckMateMenuHour,
  CheckmateMenuHours,
  CheckmateMenuItem,
  CheckmateMenuSection,
  CheckmateModifier,
  CheckmateModifierGroup,
} from '@interfaces/checkmate.interface';
import {
  OtterCategory,
  OtterHourInterval,
  OtterHours,
  OtterItemStatus,
  OtterMenuItemPOS,
  OtterMenuPOS,
  OtterMenus,
  OtterModifierGroupPOS,
  OtterMoney,
} from '@interfaces/otter.interface';

const checkmateHoursToNormalizedIntervals = (checkmateHours?: CheckMateMenuHour[]): NormalizedMenuHour[] =>
  checkmateHours
    ?.slice()
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map(hour => ({ startTime: hour.start_time, endTime: hour.end_time })) ?? [];

const checkmateHoursToNormalized = (hours?: CheckmateMenuHours): NormalizedMenuHours =>
  new NormalizedMenuHoursBuilder()
    .setMonday(checkmateHoursToNormalizedIntervals(hours?.monday))
    .setTuesday(checkmateHoursToNormalizedIntervals(hours?.tuesday))
    .setWednesday(checkmateHoursToNormalizedIntervals(hours?.wednesday))
    .setThursday(checkmateHoursToNormalizedIntervals(hours?.thursday))
    .setFriday(checkmateHoursToNormalizedIntervals(hours?.friday))
    .setSaturday(checkmateHoursToNormalizedIntervals(hours?.saturday))
    .setSunday(checkmateHoursToNormalizedIntervals(hours?.sunday))
    .build();

const normalizeCheckmateModifier = (modifier: CheckmateModifier): NormalizedModifier =>
  new NormalizedModifierBuilder()
    .setID(modifier.id)
    .setName(modifier.name)
    .setPrice(modifier.price)
    .setDescription(modifier.description ?? '')
    .build();

const normalizeCheckmateModifierGroup = (group: CheckmateModifierGroup): NormalizedModifierGroup =>
  new NormalizedModifierGroupsBuilder()
    .setID(group.id)
    .setName(group.name)
    .setModifiers((group.modifiers ?? []).map(normalizeCheckmateModifier))
    .build();

const normalizeCheckmateMenuItem = (item: CheckmateMenuItem): NormalizedMenuItem =>
  new NormalizedMenuItemBuilder()
    .setID(item.id)
    .setName(item.name)
    .setDescription(item.description ?? '')
    .setPrice(item.price)
    .setModifierGroups((item.modifier_groups ?? []).map(normalizeCheckmateModifierGroup))
    .build();

const normalizeCheckmateSection = (section: CheckmateMenuSection): NormalizedMenuSection =>
  new NormalizedMenuSectionBuilder()
    .setID(section.id)
    .setName(section.name)
    .setDescription(section.description ?? '')
    .setItems((section.items ?? []).map(normalizeCheckmateMenuItem))
    .build();

const normalizeCheckmateMenu = (menu: CheckmateMenu): NormalizedMenu =>
  new NormalizedMenuBuilder()
    .setID(menu.id)
    .setName(menu.name)
    .setDescription(menu.description ?? '')
    .setHours(checkmateHoursToNormalized(menu.hours))
    .setSections((menu.sections ?? []).map(normalizeCheckmateSection))
    .build();

export const normalizeCheckmateMenus = (menus: CheckmateMenu[]): NormalizedMenu[] => (menus ?? []).map(normalizeCheckmateMenu);

const pad2 = (n: number): string => String(n).padStart(2, '0');

const otterHourIntervalToNormalized = (interval: OtterHourInterval): NormalizedMenuHour => ({
  startTime: `${pad2(interval.fromHour)}:${pad2(interval.fromMinute)}`,
  endTime: `${pad2(interval.toHour)}:${pad2(interval.toMinute)}`,
});

const otterHoursToNormalized = (hours?: OtterHours): NormalizedMenuHours => {
  const intervals = hours?.intervals ?? [];
  const forDay = (day: OtterHourInterval['day']): NormalizedMenuHour[] =>
    intervals.filter(interval => interval.day === day).map(otterHourIntervalToNormalized);

  return new NormalizedMenuHoursBuilder()
    .setMonday(forDay('MONDAY'))
    .setTuesday(forDay('TUESDAY'))
    .setWednesday(forDay('WEDNESDAY'))
    .setThursday(forDay('THURSDAY'))
    .setFriday(forDay('FRIDAY'))
    .setSaturday(forDay('SATURDAY'))
    .setSunday(forDay('SUNDAY'))
    .build();
};

/** Otter's `Money.amount` is a decimal (e.g. `7.65` = $7.65); this system stores prices as integer cents. */
const otterPriceToCents = (money?: OtterMoney): number => Math.round((money?.amount ?? 0) * 100);

/**
 * Both `INDEFINITELY_NOT_FOR_SALE` and `TEMPORARILY_NOT_FOR_SALE` mean "86'd" from TapTab's
 * perspective — TapTab's `is_hidden` is a plain boolean with no "until when" concept, so the
 * distinction (and `suspendedUntil`) doesn't carry through. When Otter later reports the item as
 * `FOR_SALE` again (its own auto-resume, or a manual un-86), the next sync un-hides it — no need to
 * track the resume timestamp ourselves. Missing/malformed status defaults to visible (`false`),
 * matching this normalizer's existing "degrade gracefully on malformed data" convention rather than
 * hiding an item just because a field was absent.
 */
const otterItemIsHidden = (status?: OtterItemStatus): boolean => status?.saleStatus != null && status.saleStatus !== 'FOR_SALE';

type OtterMenuLookups = {
  categories: Record<string, OtterCategory>;
  items: Record<string, OtterMenuItemPOS>;
  modifierGroups: Record<string, OtterModifierGroupPOS>;
};

const resolveByIds = <T>(ids: string[] | undefined, byId: Record<string, T>): T[] =>
  (ids ?? []).map(id => byId[id]).filter((entity): entity is T => Boolean(entity));

const normalizeOtterModifier = (modifierItem: OtterMenuItemPOS): NormalizedModifier =>
  new NormalizedModifierBuilder()
    .setID(modifierItem.id)
    .setName(modifierItem.name)
    .setPrice(otterPriceToCents(modifierItem.price))
    .setDescription(modifierItem.description ?? '')
    .setIsHidden(otterItemIsHidden(modifierItem.status))
    .build();

const normalizeOtterModifierGroup = (group: OtterModifierGroupPOS, items: Record<string, OtterMenuItemPOS>): NormalizedModifierGroup =>
  new NormalizedModifierGroupsBuilder()
    .setID(group.id)
    .setName(group.name)
    .setModifiers(resolveByIds(group.itemIds, items).map(normalizeOtterModifier))
    .setMinimumSelections(group.minimumSelections ?? null)
    .setMaximumSelections(group.maximumSelections ?? null)
    .setMaxPerModifierSelectionQuantity(group.maxPerModifierSelectionQuantity ?? null)
    .build();

const normalizeOtterMenuItem = (item: OtterMenuItemPOS, lookups: Pick<OtterMenuLookups, 'items' | 'modifierGroups'>): NormalizedMenuItem =>
  new NormalizedMenuItemBuilder()
    .setID(item.id)
    .setName(item.name)
    .setDescription(item.description ?? '')
    .setPrice(otterPriceToCents(item.price))
    .setModifierGroups(resolveByIds(item.modifierGroupIds, lookups.modifierGroups).map(group => normalizeOtterModifierGroup(group, lookups.items)))
    .setIsHidden(otterItemIsHidden(item.status))
    .build();

const normalizeOtterSection = (category: OtterCategory, lookups: Pick<OtterMenuLookups, 'items' | 'modifierGroups'>): NormalizedMenuSection =>
  new NormalizedMenuSectionBuilder()
    .setID(category.id)
    .setName(category.name)
    .setDescription(category.description ?? '')
    .setItems(resolveByIds(category.itemIds, lookups.items).map(item => normalizeOtterMenuItem(item, lookups)))
    .build();

const normalizeOtterMenu = (menu: OtterMenuPOS, lookups: OtterMenuLookups): NormalizedMenu =>
  new NormalizedMenuBuilder()
    .setID(menu.id)
    .setName(menu.name)
    .setDescription(menu.description ?? '')
    .setHours(otterHoursToNormalized(menu.hours))
    .setSections(resolveByIds(menu.categoryIds, lookups.categories).map(category => normalizeOtterSection(category, lookups)))
    .build();

/**
 * Normalizes Otter's `GET /v1/menus` response into the shared `NormalizedMenu[]` shape consumed by
 * the menu-sync diff pipeline (`MenuSyncProcessor`), the same shape `normalizeCheckmateMenus` builds.
 *
 * Otter returns a flat graph (menus/categories/items/modifierGroups referencing each other by id, not
 * nested), and a "modifier" is just an item referenced from a `modifierGroup.itemIds`. This walks
 * `menu.categoryIds → category.itemIds → item.modifierGroupIds → group.itemIds` to build the nested
 * tree the pipeline expects.
 *
 * v1 scope: a modifier's own `modifierGroupIds` (Otter supports nested modifiers) is intentionally
 * not recursed into — `NormalizedModifier` has no field for it yet. Same for price overrides — that
 * exists in the DB schema (TAB-425) but not yet in this normalized shape or the sync pipeline.
 * Modifier group min/max selection rules (required vs. optional) DO carry through — see
 * `normalizeOtterModifierGroup`. Item/modifier availability (`status.saleStatus`, i.e. 86'ing) DOES
 * carry through too — see `otterItemIsHidden`; Otter is the source of truth for availability, so a
 * subsequent sync overwrites any manual hide/unhide a manager made directly in TapManager for the
 * same item. See Documentation/OTTER_MENU_SYNC.md.
 */
export const normalizeOtterMenus = (otterMenus: OtterMenus): NormalizedMenu[] => {
  const lookups: OtterMenuLookups = {
    categories: otterMenus?.categories ?? {},
    items: otterMenus?.items ?? {},
    modifierGroups: otterMenus?.modifierGroups ?? {},
  };

  return Object.values(otterMenus?.menus ?? {}).map(menu => normalizeOtterMenu(menu, lookups));
};

export const stringifyNormalizedMenus = (menus: NormalizedMenu[]): string => {
  return stableStringify(menus) ?? '[]';
};
