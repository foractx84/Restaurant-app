import { PaymentPlan } from '@enums/paymentPlan';
import { DateTime } from 'luxon';

const EST_TIMEZONE = 'America/New_York';
const parseDate = (datetime: Date): string => {
  return datetime.toISOString().replace('T', ' ').replace('Z', '');
};

/**
 * Gets the current date time for the provided timezone
 * @param locales
 * @param timezone
 */
export const getCurrentTimeForTimeZone = (locales = 'en-US', timezone = EST_TIMEZONE): Date => {
  return new Date(
    new Date().toLocaleString(locales, {
      timeZone: timezone,
    }),
  );
};

/**
 * Converts the given date time to the provided timezone
 * @param timestamp timestamp without time zone - ex: '2017-05-15T09:10:23'
 * @param locales
 * @param timezone
 */
export const getTimeForTimeZone = (timestamp: string, locales: string, timezone: string): Date => {
  return new Date(
    new Date(timestamp).toLocaleString(locales, {
      timeZone: timezone,
    }),
  );
};

/**
 * Gets the utc date time from the provided timezone
 * @param timestamp timestamp without time zone - ex: '2017-05-15T09:10:23.329246'
 * @param timezone
 */
export const getUTCFromTimeZone = (timestamp: string, timezone: string): Date => {
  const dateTime: DateTime = DateTime.fromISO(timestamp, { zone: timezone });
  return new Date(dateTime.toUTC().toSQL({ includeOffset: true }));
};

/**
 * Gets the timezone date time from the utc timestamp
 * @param timestamp timestamp without time zone from psql database - ex: '2017-05-15 09:10:23.329'
 * @param timezone
 * @return {@type Date}
 */
export const getTimeZoneDateFromUTC = (timestamp: Date, timezone: string): Date => {
  const parsedTime = timestamp.toISOString().replace(' ', 'T');
  const utcDate: DateTime = DateTime.fromISO(parsedTime, { zone: 'utc' });
  const dateTime: DateTime = utcDate.setZone(timezone);
  return dateTime.toJSDate();
};

/**
 * Gets the timezone date time from the utc timestamp
 * @param timestamp timestamp without time zone from psql database - ex: '2017-05-15 09:10:23.329'
 * @param timezone
 * @return {@type string} ex: '2017-05-15T09:10:23.329'
 */
export const getTimeZoneFromUTC = (timestamp: Date, timezone: string): string => {
  const parsedTime = timestamp.toISOString().replace(' ', 'T');
  const utcDate: DateTime = DateTime.fromISO(parsedTime, { zone: 'utc' });
  const dateTime: DateTime = utcDate.setZone(timezone);
  return dateTime.toISO({ includeOffset: false });
};

/**
 * Current Date/Time parsed in an acceptable format for psql
 * Ex: 2022-09-22 16:24:51.865
 */
export const getCurrentDate = (): string => {
  return parseDate(new Date(Date.now()));
};

/**
 * Current Date/Time plus timespan provided:
 *   - 'monthly' adds month
 *   - 'annually' adds year
 *   - if unknown provided the returns current Date/Time
 * @param timespan
 */
export const getCurrentPlusTime = (timespan: string): string => {
  const date: Date = new Date(Date.now());
  if (timespan === PaymentPlan.MONTHLY) {
    const month = new Date(Date.now()).getMonth();
    date.setMonth(month === 11 ? 0 : month + 1);
    return parseDate(date);
  } else if (timespan === PaymentPlan.ANNUALLY) {
    date.setFullYear(new Date(Date.now()).getFullYear() + 1);
    return parseDate(date);
  } else {
    return getCurrentDate();
  }
};
