import { MenuHours } from '@interfaces/menuHours.interface';
import { IsNotEmpty, IsString, Validate, IsMilitaryTime } from 'class-validator';
import { CustomDayValidation } from '@validation/dayValidation';

export class CreateMenusRequestBodyMenuHoursArrayDto implements MenuHours {
  @IsString()
  @IsNotEmpty()
  @Validate(CustomDayValidation, {
    message: "Provided day must be 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday' or 'Friday'",
  })
  public day: string;

  @IsString()
  @IsNotEmpty()
  @IsMilitaryTime()
  public start: string;

  @IsString()
  @IsNotEmpty()
  @IsMilitaryTime()
  public end: string;
}
