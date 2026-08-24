import { IsInt, IsPositive, ValidateNested, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

import { Type } from 'class-transformer';
import { BrandSocialsDto } from './brandSocials.dto';

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

  @IsString()
  @IsOptional()
  public description?: string;

  @IsString()
  @IsOptional()
  public website?: string;

  @IsString()
  @IsOptional()
  public primaryTagline?: string;

  @IsString()
  @IsOptional()
  public secondaryTagline?: string;

  @IsString()
  @IsOptional()
  public reservationUrl?: string;

  @IsString()
  @IsOptional()
  public orderingUrl?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  public cuisineID?: number;

  @ValidateNested()
  @Type(() => BrandSocialsDto)
  @IsOptional()
  public socials?: BrandSocialsDto;
}

export class EditBrandDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsString()
  @IsOptional()
  public website?: string;

  @IsString()
  @IsOptional()
  public primaryTagline?: string;

  @IsString()
  @IsOptional()
  public secondaryTagline?: string;

  @IsString()
  @IsOptional()
  public reservationUrl?: string;

  @IsString()
  @IsOptional()
  public orderingUrl?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  public cuisineID?: number;

  @ValidateNested()
  @Type(() => BrandSocialsDto)
  @IsOptional()
  public socials?: BrandSocialsDto;
}
