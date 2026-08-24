import {
  CreateManagerInterface,
  ManagerEditInfoRequestInterface,
  ManagerUpdatePasswordRequestInterface,
  ResendEmailRequestInterface,
  VerifyManagerRequestInterface,
} from '@interfaces/managers.interface';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize, IsOptional, IsEmail, MinLength, Validate, IsPositive, IsInt } from 'class-validator';
import { isValidPassword } from '@validation/isValidPassword';

export class CreateManagerDto implements CreateManagerInterface {
  @IsString()
  @IsNotEmpty()
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  public lastName: string;

  @IsString()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public phone: string;

  @IsString()
  @IsNotEmpty()
  @Validate(isValidPassword, {
    message: 'Manager password invalid, must have >= 9 characters, a special character, a number, a lowercase letter, and an uppercase letter',
  })
  public pwd: string;

  @IsOptional()
  @IsString()
  public titleName: string;

  @IsArray()
  @ArrayMinSize(1)
  public restaurantIDs: number[];
}

export class SignupManagerDto implements CreateManagerInterface {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @MinLength(1)
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  public phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Validate(isValidPassword, {
    message: 'Manager password invalid, must have >= 9 characters, a special character, a number, a lowercase letter, and an uppercase letter',
  })
  public pwd: string;

  @IsString()
  @MinLength(1)
  public titleName: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  public stripeCustomerID: string;
}

export class ManagerUpdatePasswordDto implements ManagerUpdatePasswordRequestInterface {
  @IsString()
  @IsNotEmpty()
  public currentPassword: string;

  @IsString()
  @IsNotEmpty()
  public newPassword: string;
}

export class ResendEmailDto implements ResendEmailRequestInterface {
  @IsEmail()
  @IsNotEmpty()
  @MinLength(1)
  public email: string;
}

export class VerifyManagerDto implements VerifyManagerRequestInterface {
  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  public managerID: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public verificationCode: string;
}

export class ManagerEditInfoDto implements ManagerEditInfoRequestInterface {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @MinLength(1)
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  public phone: string;
}
