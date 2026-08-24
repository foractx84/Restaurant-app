import {
  CreateMenuSectionsRequestInterface,
  DeleteMenuSectionsRequestInterface,
  EditMenuSectionRequestInterface,
  HideMenuSectionRequestInterface,
  MenuSectionNameAndMessageInterface,
  ReorderMenuSectionsRequestInterface,
} from '@interfaces/menuSections.interface';
import {
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsString,
  ArrayUnique,
  IsInt,
  IsPositive,
  ArrayNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuSectionsDto implements CreateMenuSectionsRequestInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuID: number;

  @IsArray()
  @ArrayNotEmpty()
  public menuSections: MenuSectionNameAndMessage[];
}

export class DeleteMenuSectionsDto implements DeleteMenuSectionsRequestInterface {
  @IsNumberString()
  @IsNotEmpty()
  public menuSectionID: number;
}

export class ReorderMenuSectionsDto implements ReorderMenuSectionsRequestInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuID: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayUnique()
  public menuSectionsOrder: number[];
}

export class EditMenuSectionDto implements EditMenuSectionRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuID: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuSectionID: number;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public menuSectionName: string;

  @IsString()
  @IsOptional()
  public message: string;
}

export class MenuSectionNameAndMessage implements MenuSectionNameAndMessageInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  public message?: string;
}

export class HideMenuSectionDto implements HideMenuSectionRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuSectionID: number;

  @IsNotEmpty()
  @IsBoolean()
  public hide: boolean;
}
