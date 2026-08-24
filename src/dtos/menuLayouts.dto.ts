import { UpdateRestaurantMenuLayoutRequestInterface } from '@interfaces/menuLayout.interface';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class UpdateRestaurantMenuLayoutDto implements UpdateRestaurantMenuLayoutRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public layoutID: number;
}
