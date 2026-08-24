import { normalizeOtterMenus } from '@utils/normalize';
import { OtterItemStatus, OtterMenus } from '@interfaces/otter.interface';

const FOR_SALE: OtterItemStatus = { saleStatus: 'FOR_SALE' };

describe('normalizeOtterMenus', () => {
  it('walks menu -> category -> item -> modifierGroup -> modifier and converts prices to integer cents', () => {
    const otterMenus: OtterMenus = {
      menus: {
        'menu-1': { id: 'menu-1', name: 'Main Menu', description: 'All day', categoryIds: ['cat-1'] },
      },
      categories: {
        'cat-1': { id: 'cat-1', name: 'Burgers', description: 'Beef & more', itemIds: ['item-1'] },
      },
      items: {
        'item-1': {
          id: 'item-1',
          name: 'Cheeseburger',
          description: 'With cheese',
          price: { currencyCode: 'USD', amount: 7.65 },
          status: FOR_SALE,
          modifierGroupIds: ['group-1'],
        },
        'mod-1': {
          id: 'mod-1',
          name: 'Extra Cheese',
          description: 'More cheese',
          price: { currencyCode: 'USD', amount: 1.5 },
          status: FOR_SALE,
        },
      },
      modifierGroups: {
        'group-1': { id: 'group-1', name: 'Toppings', itemIds: ['mod-1'] },
      },
    };

    const [normalized] = normalizeOtterMenus(otterMenus);

    expect(normalized.id).toBe('menu-1');
    expect(normalized.name).toBe('Main Menu');
    expect(normalized.sections).toHaveLength(1);

    const [section] = normalized.sections;
    expect(section.id).toBe('cat-1');
    expect(section.items).toHaveLength(1);

    const [item] = section.items;
    expect(item.id).toBe('item-1');
    expect(item.price).toBe(765);
    expect(item.modifierGroups).toHaveLength(1);

    const [modifierGroup] = item.modifierGroups;
    expect(modifierGroup.id).toBe('group-1');
    expect(modifierGroup.modifiers).toHaveLength(1);

    const [modifier] = modifierGroup.modifiers;
    expect(modifier.id).toBe('mod-1');
    expect(modifier.name).toBe('Extra Cheese');
    expect(modifier.price).toBe(150);
  });

  it('carries modifier group min/max selection rules through (required vs. optional)', () => {
    const otterMenus: OtterMenus = {
      menus: { 'menu-1': { id: 'menu-1', name: 'Main Menu', categoryIds: ['cat-1'] } },
      categories: { 'cat-1': { id: 'cat-1', name: 'Burgers', itemIds: ['item-1'] } },
      items: {
        'item-1': {
          id: 'item-1',
          name: 'Cheeseburger',
          price: { currencyCode: 'USD', amount: 5 },
          status: FOR_SALE,
          modifierGroupIds: ['required-group', 'optional-group'],
        },
        'mod-1': { id: 'mod-1', name: 'Well Done', price: { currencyCode: 'USD', amount: 0 }, status: FOR_SALE },
        'mod-2': { id: 'mod-2', name: 'Extra Cheese', price: { currencyCode: 'USD', amount: 1 }, status: FOR_SALE },
      },
      modifierGroups: {
        // e.g. "temperature of a steak" — customer must pick exactly one.
        'required-group': { id: 'required-group', name: 'Temperature', itemIds: ['mod-1'], minimumSelections: 1, maximumSelections: 1 },
        // e.g. "toppings on a pizza" — no min/max sent by Otter for this group.
        'optional-group': { id: 'optional-group', name: 'Toppings', itemIds: ['mod-2'] },
      },
    };

    const [normalized] = normalizeOtterMenus(otterMenus);
    const [requiredGroup, optionalGroup] = normalized.sections[0].items[0].modifierGroups;

    expect(requiredGroup.minimumSelections).toBe(1);
    expect(requiredGroup.maximumSelections).toBe(1);

    // Unset on the source payload normalizes to `null` (not `undefined`) —
    // matches the DB/entity convention of NULL meaning "no limit."
    expect(optionalGroup.minimumSelections).toBeNull();
    expect(optionalGroup.maximumSelections).toBeNull();
  });

  it('carries item and modifier availability through as isHidden (86ing)', () => {
    const otterMenus: OtterMenus = {
      menus: { 'menu-1': { id: 'menu-1', name: 'Main Menu', categoryIds: ['cat-1'] } },
      categories: { 'cat-1': { id: 'cat-1', name: 'Burgers', itemIds: ['available-item', 'indefinite-86', 'temporary-86'] } },
      items: {
        'available-item': {
          id: 'available-item',
          name: 'Cheeseburger',
          price: { currencyCode: 'USD', amount: 5 },
          status: { saleStatus: 'FOR_SALE' },
          modifierGroupIds: [],
        },
        'indefinite-86': {
          id: 'indefinite-86',
          name: 'Out of Bacon',
          price: { currencyCode: 'USD', amount: 5 },
          status: { saleStatus: 'INDEFINITELY_NOT_FOR_SALE' },
          modifierGroupIds: [],
        },
        'temporary-86': {
          id: 'temporary-86',
          name: 'Sold Out Today',
          price: { currencyCode: 'USD', amount: 5 },
          status: { saleStatus: 'TEMPORARILY_NOT_FOR_SALE', suspendedUntil: '2026-08-20T00:00:00Z' },
          modifierGroupIds: ['toppings'],
        },
        'mod-1': { id: 'mod-1', name: '86d Topping', price: { currencyCode: 'USD', amount: 0 }, status: { saleStatus: 'INDEFINITELY_NOT_FOR_SALE' } },
      },
      modifierGroups: {
        toppings: { id: 'toppings', name: 'Toppings', itemIds: ['mod-1'] },
      },
    };

    const [normalized] = normalizeOtterMenus(otterMenus);
    const items = normalized.sections[0].items;

    expect(items.find(i => i.id === 'available-item').isHidden).toBe(false);
    expect(items.find(i => i.id === 'indefinite-86').isHidden).toBe(true);
    expect(items.find(i => i.id === 'temporary-86').isHidden).toBe(true);

    const [modifier] = items.find(i => i.id === 'temporary-86').modifierGroups[0].modifiers;
    expect(modifier.isHidden).toBe(true);
  });

  it('defaults isHidden to false when status is missing (defensively, against malformed API data)', () => {
    const otterMenus: OtterMenus = {
      menus: { 'menu-1': { id: 'menu-1', name: 'Main Menu', categoryIds: ['cat-1'] } },
      categories: { 'cat-1': { id: 'cat-1', name: 'Burgers', itemIds: ['item-1'] } },
      items: { 'item-1': { id: 'item-1', name: 'Cheeseburger' } as never },
      modifierGroups: {},
    };

    const [normalized] = normalizeOtterMenus(otterMenus);
    expect(normalized.sections[0].items[0].isHidden).toBe(false);
  });

  it('buckets hour intervals onto the matching day, formatted as HH:MM', () => {
    const otterMenus: OtterMenus = {
      menus: {
        'menu-1': {
          id: 'menu-1',
          name: 'Main Menu',
          categoryIds: [],
          hours: {
            intervals: [
              { day: 'MONDAY', fromHour: 9, fromMinute: 0, toHour: 17, toMinute: 30 },
              { day: 'FRIDAY', fromHour: 8, fromMinute: 5, toHour: 22, toMinute: 0 },
            ],
          },
        },
      },
      categories: {},
      items: {},
      modifierGroups: {},
    };

    const [normalized] = normalizeOtterMenus(otterMenus);

    expect(normalized.hours.Monday).toEqual([{ startTime: '09:00', endTime: '17:30' }]);
    expect(normalized.hours.Friday).toEqual([{ startTime: '08:05', endTime: '22:00' }]);
    expect(normalized.hours.Tuesday).toEqual([]);
    expect(normalized.hours.Sunday).toEqual([]);
  });

  it('treats a modifier item as having no nested modifier groups (nesting deferred)', () => {
    const otterMenus: OtterMenus = {
      menus: { 'menu-1': { id: 'menu-1', name: 'Main Menu', categoryIds: ['cat-1'] } },
      categories: { 'cat-1': { id: 'cat-1', name: 'Burgers', itemIds: ['item-1'] } },
      items: {
        'item-1': {
          id: 'item-1',
          name: 'Cheeseburger',
          price: { currencyCode: 'USD', amount: 5 },
          status: FOR_SALE,
          modifierGroupIds: ['group-1'],
        },
        'mod-1': {
          id: 'mod-1',
          name: 'Extra Cheese',
          price: { currencyCode: 'USD', amount: 1 },
          status: FOR_SALE,
          modifierGroupIds: ['nested-group'],
        },
      },
      modifierGroups: {
        'group-1': { id: 'group-1', name: 'Toppings', itemIds: ['mod-1'] },
        'nested-group': { id: 'nested-group', name: 'Cheese Type', itemIds: ['item-1'] },
      },
    };

    const [normalized] = normalizeOtterMenus(otterMenus);
    const [modifier] = normalized.sections[0].items[0].modifierGroups[0].modifiers;

    expect(modifier.id).toBe('mod-1');
    expect(modifier).not.toHaveProperty('modifierGroups');
  });

  it('drops dangling references (category/item/modifierGroup ids with no matching entry)', () => {
    const otterMenus: OtterMenus = {
      menus: { 'menu-1': { id: 'menu-1', name: 'Main Menu', categoryIds: ['cat-1', 'missing-cat'] } },
      categories: { 'cat-1': { id: 'cat-1', name: 'Burgers', itemIds: ['item-1', 'missing-item'] } },
      items: {
        'item-1': {
          id: 'item-1',
          name: 'Cheeseburger',
          price: { currencyCode: 'USD', amount: 5 },
          status: FOR_SALE,
          modifierGroupIds: ['missing-group'],
        },
      },
      modifierGroups: {},
    };

    const [normalized] = normalizeOtterMenus(otterMenus);

    expect(normalized.sections).toHaveLength(1);
    expect(normalized.sections[0].items).toHaveLength(1);
    expect(normalized.sections[0].items[0].modifierGroups).toHaveLength(0);
  });

  it('defaults a missing price/description (defensively, against malformed API data) and returns [] for an empty menus map', () => {
    const otterMenus: OtterMenus = {
      menus: { 'menu-1': { id: 'menu-1', name: 'Main Menu', categoryIds: ['cat-1'] } },
      categories: { 'cat-1': { id: 'cat-1', name: 'Burgers', itemIds: ['item-1'] } },
      items: { 'item-1': { id: 'item-1', name: 'Cheeseburger' } as never },
      modifierGroups: {},
    };

    const [normalized] = normalizeOtterMenus(otterMenus);
    expect(normalized.sections[0].items[0].price).toBe(0);
    expect(normalized.sections[0].items[0].description).toBe('');

    expect(normalizeOtterMenus({ menus: {}, categories: {}, items: {}, modifierGroups: {} })).toEqual([]);
  });
});
