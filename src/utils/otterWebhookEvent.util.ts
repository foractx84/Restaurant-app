import { OTTER_STOREFRONT_EVENT } from '@constants/otter.constants';
import { OtterWebhookEvent } from '@interfaces/otterIntegration.interface';

/**
 * Otter's real webhook event catalog isn't documented anywhere in this codebase beyond the OAuth
 * scopes requested for the client-credentials app (`OTTER.SCOPES` in `configs/config.ts`):
 * `menus.entity_suspension menus.get_current menus.publish menus.read menus.upsert_hours orders.create
 * orders.update callback.error.write ping`. The `menus.*` scopes gate menu-related events; `orders.*`
 * gates order lifecycle events; `callback.error.write`/`ping` are infra/meta events.
 *
 * A prefix check keeps menu-update routing correct as Otter adds more `menus.*` event types without
 * further code changes here, and cleanly excludes everything else — including order events and the
 * legacy `stores.upsert` account-pairing event this integration no longer acts on.
 */
const MENU_UPDATE_EVENT_PREFIX = 'menus.';

const STOREFRONT_EVENTS = new Set<string>(
  Object.values(OTTER_STOREFRONT_EVENT),
);

export const isOtterMenuUpdateEvent = (
  event: Pick<OtterWebhookEvent, 'eventType'> | null | undefined,
): boolean =>
  typeof event?.eventType === 'string' &&
  event.eventType.startsWith(MENU_UPDATE_EVENT_PREFIX);

export const isOtterStorefrontEvent = (
  event: Pick<OtterWebhookEvent, 'eventType'> | null | undefined,
): boolean =>
  typeof event?.eventType === 'string' &&
  STOREFRONT_EVENTS.has(event.eventType);
