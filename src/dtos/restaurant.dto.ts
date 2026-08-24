import { CreateRestaurantRequestInterface, EditRestaurantRequestInterface } from '@interfaces/restaurants.interface';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateRestaurantAddressRequestDto, EditRestaurantAddressRequestDto } from './restaurantAddress.dto';
import { AssignPackageToRestaurantRequestInterface } from '@interfaces/package.interface';
import { CreateRestaurantSocialsRequestDto } from './restaurantSocials.dto';
import { CreateRestaurantHoursRequestDto } from './restaurantHours.dto';
import { validateHoursNotOverlapping } from '@validation/validateHoursNotOverlapping';

export class AssignPackageToRestaurantDto implements AssignPackageToRestaurantRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public managerPackageID: number;
}

export class CreateRestaurantDto implements CreateRestaurantRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public description: string;

  @IsString()
  @MinLength(7)
  @IsNotEmpty()
  public phone: string;

  @IsEmail()
  @MinLength(1)
  @IsNotEmpty()
  public email: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public cuisineID: number;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public website: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantAddressRequestDto)
  public address: CreateRestaurantAddressRequestDto;

  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantSocialsRequestDto)
  @IsOptional()
  public socials: CreateRestaurantSocialsRequestDto;

  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @IsArray()
  @ArrayUnique()
  @Type(() => CreateRestaurantHoursRequestDto)
  @validateHoursNotOverlapping('restaurantHours', {
    message: 'Provided Hours cannot overlap',
  })
  @IsNotEmpty()
  public restaurantHours: CreateRestaurantHoursRequestDto[];

  @IsString()
  @IsOptional()
  public availabilityNotes: string;
}

export class EditRestaurantDto implements EditRestaurantRequestInterface {
  @IsString()
  @MinLength(1)
  @IsOptional()
  public name: string;

  @IsString()
  @MinLength(7)
  @IsOptional()
  public phone: string;

  @IsEmail()
  @MinLength(1)
  @IsOptional()
  public email: string;

  @ValidateNested({ each: true })
  @Type(() => EditRestaurantAddressRequestDto)
  @IsOptional()
  public address: EditRestaurantAddressRequestDto;

  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @IsArray()
  @ArrayUnique()
  @Type(() => CreateRestaurantHoursRequestDto)
  @validateHoursNotOverlapping('restaurantHours', {
    message: 'Provided Hours cannot overlap',
  })
  @IsOptional()
  public restaurantHours: CreateRestaurantHoursRequestDto[];

  @IsString()
  @IsOptional()
  public availabilityNotes: string;
}

export class LinkStripeConnectAccountDto {
  @IsString()
  @MinLength(1, { message: 'stripeAccountId is required' })
  @Matches(/^acct_[a-zA-Z0-9_]+$/, {
    message: 'stripeAccountId must be a valid Stripe account ID (e.g. acct_...)',
  })
  @IsNotEmpty()
  public stripeAccountId: string;
}

export class UpdateRestaurantOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  public restaurantIDs: number[];
}
