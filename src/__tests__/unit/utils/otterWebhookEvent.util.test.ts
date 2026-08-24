import {
  isOtterMenuUpdateEvent,
  isOtterStorefrontEvent,
} from '@utils/otterWebhookEvent.util';

describe('isOtterMenuUpdateEvent', () => {
  it.each(['menus.publish', 'menus.entity_suspension', 'menus.upsert_hours', 'menus.get_current'])(
    'returns true for menu-update event type %s',
    eventType => {
      expect(isOtterMenuUpdateEvent({ eventType })).toBe(true);
    },
  );

  it.each(['orders.create', 'orders.update', 'callback.error.write', 'ping', 'stores.upsert'])(
    'returns false for non-menu-update event type %s',
    eventType => {
      expect(isOtterMenuUpdateEvent({ eventType })).toBe(false);
    },
  );

  it('returns false for a missing eventType', () => {
    expect(isOtterMenuUpdateEvent({ eventType: undefined as unknown as string })).toBe(false);
  });

  it('returns false for a non-string eventType', () => {
    expect(isOtterMenuUpdateEvent({ eventType: 123 as unknown as string })).toBe(false);
  });

  it('returns false for a null/undefined event', () => {
    expect(isOtterMenuUpdateEvent(null)).toBe(false);
    expect(isOtterMenuUpdateEvent(undefined)).toBe(false);
  });
});

describe('isOtterStorefrontEvent', () => {
  it.each([
    'storefront.pause_store',
    'storefront.unpause_store',
    'storefront.get_store_availability',
    'storefront.get_store_hours',
  ])('returns true for storefront event %s', eventType => {
    expect(isOtterStorefrontEvent({ eventType })).toBe(true);
  });

  it.each([
    'menus.publish',
    'orders.create',
    'ping',
    'stores.upsert',
  ])('returns false for non-storefront event %s', eventType => {
    expect(isOtterStorefrontEvent({ eventType })).toBe(false);
  });

  it('returns false for a missing event type', () => {
    expect(
      isOtterStorefrontEvent({
        eventType: undefined as unknown as string,
      }),
    ).toBe(false);
  });

  it('returns false for null or undefined input', () => {
    expect(isOtterStorefrontEvent(null)).toBe(false);
    expect(isOtterStorefrontEvent(undefined)).toBe(false);
  });
});
