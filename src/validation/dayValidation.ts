import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Day } from '@/enums/day';

@ValidatorConstraint({ name: 'day', async: false })
export class CustomDayValidation implements ValidatorConstraintInterface {
  validate(category: string) {
    return Object.values(Day)
      .map(day => day.toLowerCase() as Day)
      .includes(category.toLowerCase() as Day);
  }

  defaultMessage() {
    return "Provided day must be 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday' or 'Friday'";
  }
}
