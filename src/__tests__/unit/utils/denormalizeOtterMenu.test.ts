import { buildOtterMenusUpsertRequest, OtterMenuPushInput } from '@utils/denormalizeOtterMenu';
import { GetMenuDetailsResponseInterface } from '@interfaces/menus.interface';

const buildMenu = (overrides: Partial<GetMenuDetailsResponseInterface> = {}): GetMenuDetailsResponseInterface =>
  ({
    menuID: 1,
    menuName: 'Dinner',
    restaurantID: 10,
    isPrixFixe: false,
    isHidden: false,
    messages: [],
    menuSections: [
      {
        menuSectionID: 100,
        sectionName: 'Entrees',
        items: [
          {
            menuItemID: 1000,
            name: 'Burger',
            description: 'A burger',
            isHidden: false,
            baseItemSize: { id: 1, label: 'Regular', price: 1299, priceOverride: '' },
            modifierGroups: [
              {
                modifierGroupID: 500,
                name: 'Toppings',
                label: 'Toppings',
                listOrder: 0,
                modifiers: [
                  { modifierID: 5000, name: 'Cheese', description: 'Extra cheese', price: 150, isHidden: false, listOrder: 0, media: [] },
                  { modifierID: 5001, name: 'Bacon', description: '', price: 200, isHidden: true, listOrder: 1, media: [] },
                ],
              },
            ],
          } as any,
        ],
      },
    ],
    ...overrides,
  } as GetMenuDetailsResponseInterface);

describe('buildOtterMenusUpsertRequest', () => {
  it('walks menu -> category -> item -> modifierGroup -> modifier and converts cents to Otter Money', () => {
    const input: OtterMenuPushInput[] = [{ menu: buildMenu(), hours: [] }];

    const request = buildOtterMenusUpsertRequest(input, {
      500: { minimumSelections: 0, maximumSelections: 2, maxPerModifierSelectionQuantity: 1 },
    });

    expect(request.menus['1']).toMatchObject({ id: '1', name: 'Dinner', categoryIds: ['100'] });
    expect(request.categories['100']).toMatchObject({ id: '100', name: 'Entrees', itemIds: ['1000'] });
    expect(request.items['1000']).toMatchObject({
      id: '1000',
      name: 'Burger',
      description: 'A burger',
      price: { currencyCode: 'USD', amount: 12.99 },
      status: { saleStatus: 'FOR_SALE' },
      modifierGroupIds: ['500'],
    });
    expect(request.modifierGroups['500']).toMatchObject({
      id: '500',
      name: 'Toppings',
      itemIds: ['5000', '5001'],
      minimumSelections: 0,
      maximumSelections: 2,
      maxPerModifierSelectionQuantity: 1,
    });
    expect(request.items['5000']).toMatchObject({
      id: '5000',
      name: 'Cheese',
      price: { currencyCode: 'USD', amount: 1.5 },
      status: { saleStatus: 'FOR_SALE' },
    });
  });

  it('maps a hidden item/modifier to INDEFINITELY_NOT_FOR_SALE', () => {
    const input: OtterMenuPushInput[] = [{ menu: buildMenu(), hours: [] }];

    const request = buildOtterMenusUpsertRequest(input, {});

    expect(request.items['5001'].status.saleStatus).toBe('INDEFINITELY_NOT_FOR_SALE');
  });

  it('converts menu hours into Otter interval format, uppercasing the day and parsing HH:MM', () => {
    const input: OtterMenuPushInput[] = [{ menu: buildMenu(), hours: [{ day: 'Monday', start: '09:30', end: '21:00' }] }];

    const request = buildOtterMenusUpsertRequest(input, {});

    expect(request.menus['1'].hours).toEqual({
      intervals: [{ day: 'MONDAY', fromHour: 9, fromMinute: 30, toHour: 21, toMinute: 0 }],
    });
  });

  it('omits hours entirely when the menu has none', () => {
    const input: OtterMenuPushInput[] = [{ menu: buildMenu(), hours: [] }];

    const request = buildOtterMenusUpsertRequest(input, {});

    expect(request.menus['1'].hours).toBeUndefined();
  });

  it('defaults missing modifier-group selection rules and handles a menu with no sections', () => {
    const input: OtterMenuPushInput[] = [{ menu: buildMenu({ menuSections: [] }), hours: [] }];

    const request = buildOtterMenusUpsertRequest(input, {});

    expect(request.menus['1']).toMatchObject({ id: '1', categoryIds: [] });
    expect(Object.keys(request.categories)).toHaveLength(0);
    expect(Object.keys(request.items)).toHaveLength(0);
  });

  it("uses externalID (Otter's own id) instead of the internal id when the entity originated on Otter", () => {
    // Otter's POST /v1/menus is a full-replacement upsert keyed by id -- pushing an entity under a
    // different id than the one Otter already knows it by creates a duplicate rather than updating
    // the existing one. Every level here gets its own externalID, distinct from its internal id, to
    // prove none of them silently fall back to the internal id when an externalID IS present -- and
    // that cross-references (categoryIds/itemIds/modifierGroupIds) key off the same externalID-based
    // id used for that entity's own `id` field, not the internal one.
    const menu: GetMenuDetailsResponseInterface = {
      menuID: 1,
      menuName: 'Dinner',
      restaurantID: 10,
      isPrixFixe: false,
      isHidden: false,
      externalID: 'otter-menu-uuid',
      messages: [],
      menuSections: [
        {
          menuSectionID: 100,
          sectionName: 'Entrees',
          externalID: 'otter-section-uuid',
          items: [
            {
              menuItemID: 1000,
              name: 'Burger',
              description: 'A burger',
              isHidden: false,
              externalID: 'otter-item-uuid',
              baseItemSize: { id: 1, label: 'Regular', price: 1299, priceOverride: '' },
              modifierGroups: [
                {
                  modifierGroupID: 500,
                  name: 'Toppings',
                  label: 'Toppings',
                  listOrder: 0,
                  externalID: 'otter-group-uuid',
                  modifiers: [
                    {
                      modifierID: 5000,
                      name: 'Cheese',
                      description: 'Extra cheese',
                      price: 150,
                      isHidden: false,
                      listOrder: 0,
                      media: [],
                      externalID: 'otter-modifier-uuid',
                    },
                  ],
                },
              ],
            } as any,
          ],
        },
      ],
    } as GetMenuDetailsResponseInterface;

    const request = buildOtterMenusUpsertRequest([{ menu, hours: [] }], {
      500: { minimumSelections: 1, maximumSelections: 1 },
    });

    expect(request.menus['otter-menu-uuid']).toMatchObject({ id: 'otter-menu-uuid', categoryIds: ['otter-section-uuid'] });
    expect(request.categories['otter-section-uuid']).toMatchObject({ id: 'otter-section-uuid', itemIds: ['otter-item-uuid'] });
    expect(request.items['otter-item-uuid']).toMatchObject({ id: 'otter-item-uuid', modifierGroupIds: ['otter-group-uuid'] });
    expect(request.modifierGroups['otter-group-uuid']).toMatchObject({ id: 'otter-group-uuid', itemIds: ['otter-modifier-uuid'] });
    expect(request.items['otter-modifier-uuid']).toMatchObject({ id: 'otter-modifier-uuid', name: 'Cheese' });

    // None of the internal-id-keyed entries should exist -- proves this isn't just adding a second
    // (duplicate) entry alongside the internal-id one.
    expect(request.menus['1']).toBeUndefined();
    expect(request.categories['100']).toBeUndefined();
    expect(request.items['1000']).toBeUndefined();
    expect(request.modifierGroups['500']).toBeUndefined();
    expect(request.items['5000']).toBeUndefined();
  });

  it('aggregates multiple menus into the same flat maps', () => {
    const secondMenu = buildMenu({ menuID: 2, menuName: 'Lunch', menuSections: [] });
    const input: OtterMenuPushInput[] = [
      { menu: buildMenu(), hours: [] },
      { menu: secondMenu, hours: [] },
    ];

    const request = buildOtterMenusUpsertRequest(input, {});

    expect(Object.keys(request.menus)).toEqual(['1', '2']);
    expect(request.menus['2']).toMatchObject({ id: '2', name: 'Lunch' });
  });
});
