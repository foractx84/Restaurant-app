import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class RestaurantGroupIDParamDto {
  @IsUUID()
  @IsNotEmpty()
  public restaurantGroupID: string;
}

export class CreateRestaurantGroupDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;
}
