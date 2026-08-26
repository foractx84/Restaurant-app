import { Day } from '@/enums/day';
import { RestaurantHoursEntity } from '@entities/restaurantHours.entity';
import { buildOtterStoreHoursRequest } from '@utils/otterStoreHours.mapper';

const hoursRow = (day: Day, start: string, end: string): RestaurantHoursEntity =>
  ({ day, start, end }) as RestaurantHoursEntity;

const regularHours = (rows: RestaurantHoursEntity[]) => buildOtterStoreHoursRequest(rows).storeHoursConfiguration.deliveryHours?.regularHours ?? [];

describe('buildOtterStoreHoursRequest', () => {
  it('builds the full envelope Otter expects', () => {
    const request = buildOtterStoreHoursRequest([hoursRow(Day.MON, '09:00', '17:00')], 'America/Los_Angeles');
    const expectedRegularHours = [{ dayOfWeek: 'MONDAY', timeRanges: [{ startTime: '09:00', endTime: '17:00' }] }];

    expect(request).toEqual({
      storeHoursConfiguration: {
        deliveryHours: { regularHours: expectedRegularHours },
        pickupHours: { regularHours: expectedRegularHours },
        timezone: 'America/Los_Angeles',
      },
      statusChangedAt: expect.any(String),
    });
  });

  describe('channels', () => {
    // Otter models delivery and pickup separately; TapTab has one set of hours, so both are populated.
    // Sending only deliveryHours would leave pickup unconfigured on Otter's side.
    it('reports the same schedule for delivery and pickup', () => {
      const { storeHoursConfiguration } = buildOtterStoreHoursRequest([hoursRow(Day.MON, '09:00', '17:00')], 'America/Denver');

      expect(storeHoursConfiguration.pickupHours).toEqual(storeHoursConfiguration.deliveryHours);
    });

    it('does not share time-range objects between the two channels', () => {
      const { storeHoursConfiguration } = buildOtterStoreHoursRequest([hoursRow(Day.MON, '09:00', '17:00')], 'America/Denver');

      expect(storeHoursConfiguration.pickupHours?.regularHours[0].timeRanges).not.toBe(storeHoursConfiguration.deliveryHours?.regularHours[0].timeRanges);
    });
  });

  describe('timezone', () => {
    // restaurant_address.timezone defaults to "America/New York" -- a space, which is not legal IANA
    // and which Otter would reject. Existing rows carry both spellings.
    it('repairs the malformed space-separated default to a valid IANA name', () => {
      expect(buildOtterStoreHoursRequest([], 'America/New York').storeHoursConfiguration.timezone).toBe('America/New_York');
    });

    it('passes a already-valid IANA name through unchanged', () => {
      expect(buildOtterStoreHoursRequest([], 'America/Los_Angeles').storeHoursConfiguration.timezone).toBe('America/Los_Angeles');
    });

    it.each([[undefined], [null], [''], ['   ']])('falls back to a default zone for %p', tz => {
      expect(buildOtterStoreHoursRequest([], tz as string | null | undefined).storeHoursConfiguration.timezone).toBe('America/New_York');
    });
  });

  it.each([
    [Day.MON, 'MONDAY'],
    [Day.TUE, 'TUESDAY'],
    [Day.WED, 'WEDNESDAY'],
    [Day.THU, 'THURSDAY'],
    [Day.FRI, 'FRIDAY'],
    [Day.SAT, 'SATURDAY'],
    [Day.SUN, 'SUNDAY'],
  ])('maps Day.%s to Otter dayOfWeek %s', (day, expected) => {
    expect(regularHours([hoursRow(day, '09:00', '17:00')])[0].dayOfWeek).toBe(expected);
  });

  describe('grouping', () => {
    // restaurant_hours stores one row per open window, but Otter nests same-day windows as multiple
    // timeRanges under a single dayOfWeek. Emitting two MONDAY entries would misrepresent the schedule.
    it('collapses multiple windows on the same day into one entry with multiple timeRanges', () => {
      const result = regularHours([hoursRow(Day.MON, '11:00', '14:00'), hoursRow(Day.MON, '17:00', '22:00')]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        dayOfWeek: 'MONDAY',
        timeRanges: [
          { startTime: '11:00', endTime: '14:00' },
          { startTime: '17:00', endTime: '22:00' },
        ],
      });
    });

    it('sorts timeRanges by start time regardless of row order', () => {
      const result = regularHours([hoursRow(Day.MON, '17:00', '22:00'), hoursRow(Day.MON, '11:00', '14:00')]);

      expect(result[0].timeRanges.map(range => range.startTime)).toEqual(['11:00', '17:00']);
    });

    it('emits days in Monday-first order regardless of row order', () => {
      const result = regularHours([hoursRow(Day.SUN, '09:00', '17:00'), hoursRow(Day.WED, '09:00', '17:00'), hoursRow(Day.MON, '09:00', '17:00')]);

      expect(result.map(entry => entry.dayOfWeek)).toEqual(['MONDAY', 'WEDNESDAY', 'SUNDAY']);
    });

    it('omits days that have no hours rather than emitting empty timeRanges', () => {
      const result = regularHours([hoursRow(Day.MON, '09:00', '17:00')]);

      expect(result.map(entry => entry.dayOfWeek)).toEqual(['MONDAY']);
    });
  });

  describe('time normalization', () => {
    it.each([
      ['9:00', '09:00'],
      ['09:00', '09:00'],
      ['09:00:00', '09:00'],
      ['9:5', '09:05'],
      ['00:00', '00:00'],
      ['23:59', '23:59'],
    ])('normalizes %s to %s', (stored, expected) => {
      expect(regularHours([hoursRow(Day.MON, stored, '23:00')])[0].timeRanges[0].startTime).toBe(expected);
    });

    it('defaults a missing minute component to :00', () => {
      expect(regularHours([hoursRow(Day.MON, '9', '17')])[0].timeRanges[0]).toEqual({ startTime: '09:00', endTime: '17:00' });
    });
  });

  describe('unusable input', () => {
    // A malformed range would 422 the whole /v1/storefront/hours call, taking valid days down with it.
    it.each(['', 'not-a-time', '24:00', '09:60', '-1:00'])('drops the row when a time is unparseable (%s)', bad => {
      expect(regularHours([hoursRow(Day.MON, bad, '17:00')])).toEqual([]);
    });

    it('drops only the malformed row and keeps the valid ones', () => {
      const result = regularHours([hoursRow(Day.MON, 'garbage', '17:00'), hoursRow(Day.TUE, '09:00', '17:00')]);

      expect(result).toEqual([{ dayOfWeek: 'TUESDAY', timeRanges: [{ startTime: '09:00', endTime: '17:00' }] }]);
    });

    it('drops rows with an unrecognised day', () => {
      expect(regularHours([hoursRow('Funday' as Day, '09:00', '17:00')])).toEqual([]);
    });

    it.each([[[]], [null], [undefined]])('returns an empty schedule for %p rather than throwing', rows => {
      expect(regularHours(rows as unknown as RestaurantHoursEntity[])).toEqual([]);
    });
  });
});
