import { Day } from '@/enums/day';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { MilitaryHoursInterface } from '@/interfaces/militaryHours.interface';
import { logger } from '@/utils/logger';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Custom hours type validation.
 * Checks if hours overlap, and if so, fails validation.
 * @param property
 * @param validationOptions
 */
export const validateHoursNotOverlapping = (property: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'validateHoursNotOverlapping',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args?: ValidationArguments): Promise<boolean> | boolean {
          // checks for overlapping time spans between same day but different time windows
          // no need to convert via timezone since the request is military time and compares against other military time of same timezone
          // only hit once via create restaurant endpoint and checks against time spans within the body request only
          // and time slots are checked before writing to database
          // we can check by string or by date, either one would work, just doing string for now out of simplicity
          // Tuesday, start: 08:00 and end: 09:00 and start: 10:00 and end 12:00 would not overlap so doesnt throw error
          // Wednesday, start: 08:00 and end 09:00 and start 08:30 and end 09:00 would overlap and so would throw error
          const checkRestaurantHoursOverlappingTimes = <T extends MilitaryHoursInterface<Day, String>>(hours: T[]): boolean => {
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const days = {} as any;
            // get all time blocks of each day
            for (const hour of hours) {
              for (const day of hour.day) {
                if (!days[day]) {
                  days[day] = [
                    {
                      startTime: hour.start,
                      endTime: hour.end,
                    },
                  ];
                } else {
                  days[day].push({
                    startTime: hour.start,
                    endTime: hour.end,
                  });
                }
              }
            }
            // check each day
            for (const day of daysOfWeek) {
              if (days[day]) {
                const yesterday = day === 'Sunday' ? 'Saturday' : daysOfWeek[daysOfWeek.indexOf(day) - 1];
                // check for carryover
                if (days[yesterday]) {
                  for (const timeBlock of days[yesterday]) {
                    const { startTime: startYesterday, endTime: endYesterday } = timeBlock;
                    if (startYesterday > endYesterday) {
                      for (const currentTimeBlock of days[day]) {
                        const { startTime, endTime } = currentTimeBlock;
                        if (endYesterday >= startTime) {
                          logger.error(
                            `Carry over hours found on ${yesterday} of ${startYesterday}-${endYesterday} and today ${day} of ${startTime}-${endTime}`,
                          );
                          throw new HttpException(
                            400,
                            getErrorPayload(
                              InternalErrorCode.missingInputOrIncorrectType,
                              `Carry over hours found on ${yesterday} of ${startYesterday}-${endYesterday} and today ${day} of ${startTime}-${endTime}`,
                            ),
                          );
                        }
                      }
                    }
                  }
                }
                // check against same day
                const currentDayArray = days[day];
                for (let i = 0; i < currentDayArray.length - 1; i++) {
                  for (let j = i + 1; j < currentDayArray.length; j++) {
                    const { startTime, endTime } = currentDayArray[i];
                    const { startTime: toBeComparedStartTime, endTime: toBeComparedEndTime } = currentDayArray[j];
                    if (
                      (startTime > endTime && toBeComparedStartTime > toBeComparedEndTime) || // check if same day both blocks go past midnight
                      (startTime > endTime && toBeComparedEndTime > startTime) || // handle carryover same day
                      (toBeComparedStartTime > toBeComparedEndTime && endTime > toBeComparedStartTime) || // handle carryover same day
                      (startTime >= toBeComparedStartTime && startTime <= toBeComparedEndTime) || // for non carry over but time blocks still overlap
                      (endTime >= toBeComparedStartTime && endTime <= toBeComparedEndTime) ||
                      (toBeComparedStartTime >= startTime && toBeComparedStartTime <= endTime) ||
                      (toBeComparedEndTime >= startTime && toBeComparedEndTime <= endTime)
                    ) {
                      logger.error(
                        `Overlapping hours found on ${day} between ${startTime}-${endTime} and ${toBeComparedStartTime}-${toBeComparedEndTime}`,
                      );
                      throw new HttpException(
                        400,
                        getErrorPayload(
                          InternalErrorCode.missingInputOrIncorrectType,
                          `Overlapping hours found on ${day} between ${startTime}-${endTime} and ${toBeComparedStartTime}-${toBeComparedEndTime}`,
                        ),
                      );
                    }
                  }
                }
              }
            }

            // time spans do not overlap
            return true;
          };

          // if restaurantHours is undefined, fail validaation, else check for overlapping hour time spans
          // via making function call (if overlapping time spans, throw error, else pass validation)
          return value ? checkRestaurantHoursOverlappingTimes(value) : false;
        },
      },
    });
  };
};
