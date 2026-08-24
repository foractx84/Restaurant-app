import {
  CreateMenusRequestInterface,
  Menus,
  DeleteMenuRequestInterface,
  GetMenuDetailsRequestInterface,
  EditMenuRequestInterface,
  ReorderMenusRequestInterface,
  HideMenuRequestInterface,
  GenerateMenuFileInterface,
} from '@interfaces/menus.interface';
import { CreateMenusRequestBodyMenuHoursArrayDto } from '@dtos/menuHours.dto';
import { EditMenusRequestBodyMenuDisclaimersDto } from '@dtos/disclaimers.dto';
import {
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsString,
  ValidateNested,
  ArrayMaxSize,
  ArrayUnique,
  IsOptional,
  IsInt,
  IsPositive,
  ArrayNotEmpty,
  IsBoolean,
  MinLength,
  Validate,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMenuDisclaimersInterface, EditMenuDisclaimersInterface } from '@interfaces/disclaimers.interface';
import { CreateMenusRequestBodyMenuDisclaimersArrayDto } from '@dtos/disclaimers.dto';
import { MenuDisclaimersUniqueValidation } from '@validation/menuDisclaimerValidation';
import { MenuSectionNameAndMessage } from '@dtos/menuSections.dto';
import { FileGenerationType } from '@/enums/fileGenerationType';

export class CreateMenusDto implements CreateMenusRequestInterface {
  @IsArray()
  @IsNotEmpty()
  @ArrayMaxSize(15)
  @ArrayUnique()
  @ValidateNested({ each: true })
  @Type(() => CreateMenusRequestBodyMenusArrayDto)
  public menus: Menus[] = [];
}

export class CreateMenusRequestBodyMenusArrayDto implements Menus {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public name: string;

  @IsBoolean()
  @IsNotEmpty()
  public isPrixFixe: boolean;

  @IsBoolean()
  @IsOptional()
  public isHidden: boolean;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMenusRequestBodyMenuHoursArrayDto)
  public menuHours: CreateMenusRequestBodyMenuHoursArrayDto[];

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  @ArrayMaxSize(15)
  public menuSections: MenuSectionNameAndMessage[];

  // decorators execute on the stack, so bottom to top in terms of error handling messaging
  @ValidateNested({ each: true })
  @Type(() => CreateMenusRequestBodyMenuDisclaimersArrayDto)
  @Validate(MenuDisclaimersUniqueValidation, {
    message: "Disclaimers need to have unique positions, can't have duplicates of same position",
  })
  @ArrayUnique({
    message: 'Disclaimers must be unique',
  })
  @ArrayMaxSize(2, {
    message: 'Cannot be more than 2 disclaimers max',
  })
  @IsArray()
  @IsOptional()
  public disclaimers: CreateMenuDisclaimersInterface[];
}

export class DeleteMenusDto implements DeleteMenuRequestInterface {
  @IsNotEmpty()
  @IsNumberString()
  public menuID: number;
}

export class GetMenuDto implements GetMenuDetailsRequestInterface {
  @IsNotEmpty()
  @IsNumberString()
  public menuID: number;
}

export class EditMenusDto implements EditMenuRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuID: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  public name: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMenusRequestBodyMenuHoursArrayDto)
  public menuHours: CreateMenusRequestBodyMenuHoursArrayDto[];

  @ValidateNested({ each: true })
  @Type(() => EditMenusRequestBodyMenuDisclaimersDto)
  public disclaimers: EditMenuDisclaimersInterface;

  @IsNotEmpty()
  @IsBoolean()
  public isPrixFixe: boolean;
}

export class ReorderMenusDto implements ReorderMenusRequestInterface {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayUnique()
  public menusOrder: number[];
}

export class HideMenuDto implements HideMenuRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuID: number;

  @IsNotEmpty()
  @IsBoolean()
  public hide: boolean;
}

export class GenerateMenuFileDto implements GenerateMenuFileInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuID: number;

  @IsNotEmpty()
  @IsEnum(FileGenerationType)
  public fileFormat: FileGenerationType;
}
