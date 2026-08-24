import { IsNotEmpty, MinLength, IsString, Validate, IsInt, IsPositive, IsArray, ArrayMaxSize, ArrayUnique, ValidateNested } from 'class-validator';
import {
  CustomMenuDisclaimerPositionValidation,
  MenuDisclaimersUniqueMessageIDValidation,
  MenuDisclaimersUniqueValidation,
} from '@validation/menuDisclaimerValidation';
import { CreateMenuDisclaimersInterface, CreateMenuDisclaimersResponseInterface } from '@interfaces/disclaimers.interface';
import { EditMenuDisclaimersInterface } from '@interfaces/disclaimers.interface';
import { Type } from 'class-transformer';

export class CreateMenusRequestBodyMenuDisclaimersArrayDto implements CreateMenuDisclaimersInterface {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  public message: string;

  @IsNotEmpty()
  @IsString()
  @Validate(CustomMenuDisclaimerPositionValidation, {
    message: 'Provided category must be "menu top bar" or "menu bottom bar',
  })
  public position: string;
}

export class UpdateMenusRequestBodyMenuDisclaimersArrayDto implements CreateMenuDisclaimersResponseInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  messageID: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  message: string;
}

export class EditMenusRequestBodyMenuDisclaimersDto implements EditMenuDisclaimersInterface {
  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique()
  public DELETE: number[];

  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique()
  @ValidateNested({ each: true })
  @Type(() => CreateMenusRequestBodyMenuDisclaimersArrayDto)
  @Validate(MenuDisclaimersUniqueValidation, {
    message: "Disclaimers need to have unique positions, can't have duplicates of same position",
  })
  public INSERT: CreateMenuDisclaimersInterface[];

  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique()
  @ValidateNested({ each: true })
  @Type(() => UpdateMenusRequestBodyMenuDisclaimersArrayDto)
  @Validate(MenuDisclaimersUniqueMessageIDValidation, {
    message: "Updating disclaimers need to have unique IDs and can't have duplicates",
  })
  public UPDATE: CreateMenuDisclaimersResponseInterface[];
}
