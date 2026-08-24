import { IsNotEmpty, IsNumberString, IsString, IsUUID, MinLength } from 'class-validator';

export class BrandIDParamDto {
  @IsUUID()
  @IsNotEmpty()
  public brandID: string;
}

export class BrandRestaurantParamDto {
  @IsUUID()
  @IsNotEmpty()
  public brandID: string;

  @IsNumberString()
  @IsNotEmpty()
  public restaurantID: string;
}

export class CreateBrandDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;
}
