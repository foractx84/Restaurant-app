import { Day } from '@enums/day';
import { CreateHoursInterface } from '@interfaces/militaryHours.interface';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsMilitaryTime, IsNotEmpty } from 'class-validator';

export class CreateRestaurantHoursRequestDto implements CreateHoursInterface {
  @IsEnum(Day, { each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  @IsNotEmpty()
  public day: Day[];

  @IsMilitaryTime()
  @IsNotEmpty()
  public start: string;

  @IsMilitaryTime()
  @IsNotEmpty()
  public end: string;
}
