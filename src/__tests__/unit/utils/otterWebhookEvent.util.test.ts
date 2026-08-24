import { isOtterMenuUpdateEvent } from '@utils/otterWebhookEvent.util';

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
