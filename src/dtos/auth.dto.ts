import { ForgetPasswordInterface, ResetPasswordInterface } from '@interfaces/auth.interface';
import { UserInterface } from '@interfaces/users.interface';
import { isValidPassword } from '@validation/isValidPassword';
import { IsEmail, IsNotEmpty, IsString, Validate } from 'class-validator';

export class CreateUserDto implements UserInterface {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public password: string;
}

export class ForgetPasswordDto implements ForgetPasswordInterface {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  public email: string;
}

export class ResetPasswordDto implements ResetPasswordInterface {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public tempPassword: string;

  @IsString()
  @IsNotEmpty()
  @Validate(isValidPassword, {
    message: 'New password invalid, must have >= 9 characters, a special character, a number, a lowercase letter, and an uppercase letter',
  })
  public newPassword: string;
}
