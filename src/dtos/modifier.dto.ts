import { IsBoolean, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';
import { CreateModifierRequestInterface, DeleteModifierRequestInterface, EditModifierRequestInterface } from '@interfaces/modifier.interface';

export class CreateModifierDto implements CreateModifierRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  public description: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  public price: number;

  @IsBoolean()
  @IsOptional()
  public isHidden: boolean;
}

export class EditModifierDto implements EditModifierRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public modifierID: number;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public name: string;

  @IsString()
  @IsOptional()
  public description: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  public price: number;

  @IsBoolean()
  @IsOptional()
  public isHidden: boolean;
}

export class DeleteModifierDto implements DeleteModifierRequestInterface {
  @IsNumberString()
  @IsNotEmpty()
  modifierID: number;
}
