import { OtterDayOfWeek, OtterOperationStatus, OtterStoreState } from '@constants/otterStorefront.constants';

/**
 * Request bodies for Otter's Storefront API (`POST /v1/storefront/*`).
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-store-availability-change/
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-store-hours-configuration-change/
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-pause-store-event-result/
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-unpause-store-event-result/
 */

/**
 * Outcome of an operation Otter asked us to perform. Sent on the pause/unpause callbacks, and on the
 * availability call when it answers an Otter-initiated request (rather than reporting a
 * partner-initiated change).
 */
export interface OtterEventResultMetadata {
  operationStatus: OtterOperationStatus;
  additionalInformation?: string;
  /** ISO-8601 with milliseconds, e.g. `2007-12-03T09:15:30.000Z`. */
  operationFinishedAt: string;
}

/** Body for `POST /v1/storefront/availability`. Rate limit: 16 requests per minute. */
export interface OtterStoreAvailabilityRequest {
  storeState: OtterStoreState;
  /** ISO-8601 timestamp of when the store's state actually changed. */
  statusChangedAt: string;
  /** Omitted for partner-initiated changes; set when answering Otter's get-availability webhook. */
  eventResultMetadata?: OtterEventResultMetadata;
}

/**
 * Body for `POST /v1/storefront/pause` and `POST /v1/storefront/unpause` — the callbacks that tell
 * Otter whether the pause/unpause it requested actually succeeded on our side.
 * Rate limit: 8 requests per minute.
 */
export interface OtterStoreEventResultRequest {
  eventResultMetadata: OtterEventResultMetadata;
}

/** Start/end of an open window, both `HH:mm` in 24-hour format (e.g. `08:00`). */
export interface OtterStoreHoursTimeRange {
  startTime: string;
  endTime: string;
}

/** Regular weekly hours for one day. Otter requires at least one time range per entry. */
export interface OtterStoreRegularHours {
  dayOfWeek: OtterDayOfWeek;
  timeRanges: OtterStoreHoursTimeRange[];
}

/**
 * Date-scoped override (holidays and the like). TapTab has no equivalent data today, so this is
 * always omitted — typed here so the shape is on record if that changes.
 */
export interface OtterStoreSpecialHours {
  /** ISO-8601, e.g. `2021-10-01T00:00:00.000Z`. */
  date: string;
  timeRanges: OtterStoreHoursTimeRange[];
  specialHourType: 'OPEN' | 'CLOSED';
}

/** Hours for one fulfilment channel. */
export interface OtterStoreHours {
  regularHours: OtterStoreRegularHours[];
  specialHours?: OtterStoreSpecialHours[] | null;
}

/**
 * `deliveryHours` and `pickupHours` are separate channels. TapTab keeps a single set of operating
 * hours per location, so both are populated from `restaurant_hours` — see the mapper.
 *
 * `timezone` is an IANA zone name. Note TapTab stores this on the restaurant ADDRESS, and its column
 * default is the malformed `America/New York` (space, not underscore) — normalize before sending.
 */
export interface OtterStoreHoursConfiguration {
  deliveryHours?: OtterStoreHours | null;
  pickupHours?: OtterStoreHours | null;
  timezone: string;
}

/** Body for `POST /v1/storefront/hours`. Rate limit: 16 requests per minute. */
export interface OtterStoreHoursRequest {
  storeHoursConfiguration: OtterStoreHoursConfiguration;
  /** ISO-8601 timestamp of when the hours configuration changed. */
  statusChangedAt: string;
  /** Present when this call answers Otter's get-hours webhook. */
  eventResultMetadata?: OtterEventResultMetadata;
}
