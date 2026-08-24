import { Day } from '@/enums/day';

export interface MilitaryHoursInterface<D, S> {
  day: D[];
  start: S;
  end: S;
}

export interface CreateHoursInterface extends MilitaryHoursInterface<Day, String> {
  day: Day[];
  start: string;
  end: string;
}
