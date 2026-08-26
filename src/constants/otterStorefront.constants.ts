/**
 * Constants for Otter's Storefront API — the pause/unpause and hours/availability surface required
 * for Otter integration certification.
 *
 * Note this is a different surface from the Menus API: Storefront encodes hours as
 * `regularHours[].timeRanges[]` with `"HH:mm"` strings, whereas the Menus API uses
 * `intervals[]` with numeric `fromHour`/`fromMinute` (see `denormalizeOtterMenu.ts`). The two are
 * not interchangeable.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-store-availability-change/
 */

/**
 * Storefront availability states, verbatim from Otter's `POST /v1/storefront/availability` reference.
 * There is no bare `PAUSED` — a pause is always qualified by who or what caused it, and Otter rejects
 * an unlisted value by failing to deserialize the whole body (which surfaces as
 * `400 Successful event result with storeState and statusChangedAt equal to null`, not as a
 * field-level enum error).
 *
 * TapTab only ever sends two of these: `restaurants.is_accepting_orders` is a boolean, so it maps to
 * {@link OTTER_STORE_STATE.OPEN} / {@link OTTER_STORE_STATE.OPERATOR_PAUSED} and cannot express the
 * rest. The full set is listed because the same field is read back off Otter's availability webhook.
 *
 * `OPERATOR_PAUSED` — not `SERVICE_PROVIDER_PAUSED` — is the right one for TapTab's pause toggle:
 * the store's own operator is pausing it from TapManager. The `SERVICE_PROVIDER_*` states describe
 * delivery-network conditions (couriers unavailable, misconfigured) that TapTab has no view of.
 */
export const OTTER_STORE_STATE = {
  OPEN: 'OPEN',
  OFF_HOUR: 'OFF_HOUR',
  SERVICE_PROVIDER_PAUSED: 'SERVICE_PROVIDER_PAUSED',
  OPERATOR_PAUSED: 'OPERATOR_PAUSED',
  SERVICE_PROVIDER_PAUSED_COURIERS_UNAVAILABLE: 'SERVICE_PROVIDER_PAUSED_COURIERS_UNAVAILABLE',
  STORE_UNAVAILABLE: 'STORE_UNAVAILABLE',
  HOLIDAY_HOUR: 'HOLIDAY_HOUR',
  MENU_UNAVAILABLE: 'MENU_UNAVAILABLE',
  SERVICE_PROVIDER_PAUSED_MISCONFIGURED: 'SERVICE_PROVIDER_PAUSED_MISCONFIGURED',
  OPEN_FOR_PICKUP_ONLY: 'OPEN_FOR_PICKUP_ONLY',
  OPEN_FOR_DELIVERY_ONLY: 'OPEN_FOR_DELIVERY_ONLY',
  CLOSED_FOR_UNDETERMINED_REASON: 'CLOSED_FOR_UNDETERMINED_REASON',
} as const;

export type OtterStoreState = (typeof OTTER_STORE_STATE)[keyof typeof OTTER_STORE_STATE];

/** Outcome reported back to Otter in `eventResultMetadata.operationStatus`. */
export const OTTER_OPERATION_STATUS = {
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

export type OtterOperationStatus = (typeof OTTER_OPERATION_STATUS)[keyof typeof OTTER_OPERATION_STATUS];

/** Day names as Otter encodes them in the store hours configuration. */
export const OTTER_DAY_OF_WEEK = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const;

export type OtterDayOfWeek = (typeof OTTER_DAY_OF_WEEK)[keyof typeof OTTER_DAY_OF_WEEK];


export const OTTER_STOREFRONT_EVENT = {
  PAUSE_STORE: 'storefront.pause_store',
  UNPAUSE_STORE: 'storefront.unpause_store',
  GET_AVAILABILITY: 'storefront.get_store_availability',
  GET_HOURS: 'storefront.get_store_hours',
} as const;

export const OTTER_STOREFRONT_EVENT_PREFIX = 'storefront.';
