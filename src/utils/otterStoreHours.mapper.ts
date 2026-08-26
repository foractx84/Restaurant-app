import { Day } from '@/enums/day';
import { RestaurantHoursEntity } from '@entities/restaurantHours.entity';
import { OTTER_DAY_OF_WEEK, OtterDayOfWeek } from '@constants/otterStorefront.constants';
import { OtterStoreHoursRequest, OtterStoreHoursTimeRange, OtterStoreRegularHours } from '@interfaces/otterStorefront.interface';

/**
 * Maps TapTab's `restaurant_hours` rows into Otter's Storefront hours configuration.
 *
 * This is deliberately NOT the same as `menuHoursToOtterHours` in `denormalizeOtterMenu.ts`: the
 * Menus API takes a flat `intervals[]` list with numeric `fromHour`/`fromMinute`, whereas the
 * Storefront API takes `regularHours[]` grouped by `dayOfWeek`, each holding `timeRanges[]` of
 * `"HH:mm"` strings. Two different encodings of the same idea — don't try to share one mapper.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-store-hours-configuration-change/
 */

const DAY_TO_OTTER_DAY_OF_WEEK: Record<Day, OtterDayOfWeek> = {
  [Day.MON]: OTTER_DAY_OF_WEEK.MONDAY,
  [Day.TUE]: OTTER_DAY_OF_WEEK.TUESDAY,
  [Day.WED]: OTTER_DAY_OF_WEEK.WEDNESDAY,
  [Day.THU]: OTTER_DAY_OF_WEEK.THURSDAY,
  [Day.FRI]: OTTER_DAY_OF_WEEK.FRIDAY,
  [Day.SAT]: OTTER_DAY_OF_WEEK.SATURDAY,
  [Day.SUN]: OTTER_DAY_OF_WEEK.SUNDAY,
};

/** Emission order for `regularHours`, so the payload is stable across calls rather than insertion-ordered. */
const OTTER_DAY_ORDER: OtterDayOfWeek[] = [
  OTTER_DAY_OF_WEEK.MONDAY,
  OTTER_DAY_OF_WEEK.TUESDAY,
  OTTER_DAY_OF_WEEK.WEDNESDAY,
  OTTER_DAY_OF_WEEK.THURSDAY,
  OTTER_DAY_OF_WEEK.FRIDAY,
  OTTER_DAY_OF_WEEK.SATURDAY,
  OTTER_DAY_OF_WEEK.SUNDAY,
];

/**
 * Normalizes a stored hour string to Otter's zero-padded `HH:mm`.
 *
 * `restaurant_hours.start`/`.end` are free-form `text`, so values like `9:00`, `09:00` and
 * `09:00:00` all occur; Otter wants exactly `09:00`. Returns null for anything unparseable so the
 * caller can drop the row rather than send Otter a malformed range (which would 422 the whole call).
 */
const toOtterTime = (time: string | undefined | null): string | null => {
  const [rawHour, rawMinute] = (time ?? '').split(':');
  const hour = parseInt(rawHour, 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    return null;
  }

  const parsedMinute = parseInt(rawMinute ?? '0', 10);
  const minute = Number.isNaN(parsedMinute) ? 0 : parsedMinute;
  if (minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

/** Fallback IANA zone when a restaurant address carries none. Matches the DB column's intent. */
const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * Normalizes a stored timezone to a valid IANA name.
 *
 * `restaurant_address.timezone` defaults to `America/New York` — with a SPACE, which is not a legal
 * IANA zone and which Otter would reject. Existing rows carry both spellings, so the space form is
 * repaired here rather than trusted.
 */
const toIanaTimezone = (timezone: string | undefined | null): string => {
  const trimmed = timezone?.trim();
  return trimmed ? trimmed.replace(/\s+/g, '_') : DEFAULT_TIMEZONE;
};

/**
 * Builds the `POST /v1/storefront/hours` body from a restaurant's hours rows.
 *
 * Grouping matters: `restaurant_hours` stores one row per open window, so a restaurant with
 * separate lunch and dinner service has two Monday rows. Otter nests both as `timeRanges` under a
 * single `MONDAY` entry — emitting two `MONDAY` objects instead would misrepresent the schedule.
 * Otter also requires at least one time range per day entry, so days with no usable rows are
 * omitted entirely rather than emitted with an empty `timeRanges`.
 *
 * Otter models delivery and pickup as separate channels, but TapTab keeps a single set of operating
 * hours per location, so the same schedule is reported for both. Sending only `deliveryHours` would
 * leave pickup unconfigured on Otter's side.
 *
 * A restaurant with no usable hours yields an empty `regularHours`, which Otter reads as "never
 * open". That is the honest answer when we hold no hours, and the caller logs it.
 */
export function buildOtterStoreHoursRequest(hours: RestaurantHoursEntity[], timezone?: string | null): OtterStoreHoursRequest {
  const rangesByDay = new Map<OtterDayOfWeek, OtterStoreHoursTimeRange[]>();

  for (const hour of hours ?? []) {
    const dayOfWeek = DAY_TO_OTTER_DAY_OF_WEEK[hour?.day];
    if (!dayOfWeek) {
      continue;
    }

    const startTime = toOtterTime(hour.start);
    const endTime = toOtterTime(hour.end);
    if (!startTime || !endTime) {
      continue;
    }

    const ranges = rangesByDay.get(dayOfWeek) ?? [];
    ranges.push({ startTime, endTime });
    rangesByDay.set(dayOfWeek, ranges);
  }

  const regularHours: OtterStoreRegularHours[] = OTTER_DAY_ORDER.filter(day => rangesByDay.has(day)).map(dayOfWeek => ({
    dayOfWeek,
    timeRanges: (rangesByDay.get(dayOfWeek) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return {
    storeHoursConfiguration: {
      deliveryHours: { regularHours },
      // Same schedule: TapTab has one operating-hours concept, not per-channel hours.
      pickupHours: { regularHours: regularHours.map(entry => ({ ...entry, timeRanges: [...entry.timeRanges] })) },
      timezone: toIanaTimezone(timezone),
    },
    statusChangedAt: new Date().toISOString(),
  };
}
