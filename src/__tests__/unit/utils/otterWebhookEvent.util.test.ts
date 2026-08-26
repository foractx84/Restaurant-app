import { isOtterMenuUpdateEvent, isOtterStorefrontEvent } from '@utils/otterWebhookEvent.util';
import { OTTER_STOREFRONT_EVENT } from '@constants/otterStorefront.constants';

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

  it('returns false for storefront events, so they are not mistaken for menu syncs', () => {
    expect(isOtterMenuUpdateEvent({ eventType: OTTER_STOREFRONT_EVENT.PAUSE_STORE })).toBe(false);
  });
});

describe('isOtterStorefrontEvent', () => {
  // These four strings are confirmed verbatim against Otter's API reference example payloads.
  // A drift here fails silently at runtime -- the event is received, logged as unhandled, and dropped.
  it.each([
    ['storefront.pause_store', OTTER_STOREFRONT_EVENT.PAUSE_STORE],
    ['storefront.unpause_store', OTTER_STOREFRONT_EVENT.UNPAUSE_STORE],
    ['storefront.get_store_availability', OTTER_STOREFRONT_EVENT.GET_AVAILABILITY],
    ['storefront.get_store_hours', OTTER_STOREFRONT_EVENT.GET_HOURS],
  ])('pins the documented event type %s', (documented, constant) => {
    expect(constant).toBe(documented);
    expect(isOtterStorefrontEvent({ eventType: documented })).toBe(true);
  });

  it('returns true for an unknown storefront subtype so routing survives new event types', () => {
    expect(isOtterStorefrontEvent({ eventType: 'storefront.something_new' })).toBe(true);
  });

  it.each(['menus.publish', 'orders.create', 'callback.error.write', 'ping', 'stores.upsert'])(
    'returns false for non-storefront event type %s',
    eventType => {
      expect(isOtterStorefrontEvent({ eventType })).toBe(false);
    },
  );

  it('does not match a type that merely contains "storefront."', () => {
    expect(isOtterStorefrontEvent({ eventType: 'menus.storefront.pause_store' })).toBe(false);
  });

  it('tolerates malformed events', () => {
    expect(isOtterStorefrontEvent({ eventType: undefined as unknown as string })).toBe(false);
    expect(isOtterStorefrontEvent({ eventType: 123 as unknown as string })).toBe(false);
    expect(isOtterStorefrontEvent(null)).toBe(false);
    expect(isOtterStorefrontEvent(undefined)).toBe(false);
  });
});
