import { CoordinatesInterface, CreateRestaurantAddressRequestInterface } from '@interfaces/restaurantAddress.interface';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class CreateRestaurantAddressCoordinatesRequestDto implements CoordinatesInterface {
  @IsNumber()
  @IsOptional()
  public lat: number;

  @IsNumber()
  @IsOptional()
  public long: number;
}

export class CreateRestaurantAddressRequestDto implements CreateRestaurantAddressRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public address1: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public address2: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public streetNumber: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public streetName: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public city: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public governingDistrict: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public country: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public postalCode: string;

  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantAddressCoordinatesRequestDto)
  @IsOptional()
  public coordinates: CreateRestaurantAddressCoordinatesRequestDto;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public timezone: string;
}

export class EditRestaurantAddressRequestDto extends CreateRestaurantAddressRequestDto {
  @IsNumber()
  @IsNotEmpty()
  public restaurantAddressID: number;
}
