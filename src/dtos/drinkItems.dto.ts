import {
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
  ValidateNested,
  ArrayNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsEnum,
  IsNumberString,
  IsBoolean,
  MinLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateMenuItemRequestInterface,
  EditMenuItemRequestInterface,
  DeleteMenuItemRequestInterface,
  HideMenuItemRequestInterface,
} from '@interfaces/menuItem.interface';
import { CreateItemSizeDto } from '@dtos/itemSize.dto';
import { isBaseItemSizeIncluded } from '@validation/isBaseItemSizeIncluded';
import { isItemSizeUnique } from '@validation/isItemSizeUnique';
import { drinkItemCategory, drinkItemCategoryOperator } from '@validation/isDrinkItemValidation';

export class CreateDrinkItemsDto implements CreateMenuItemRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  public description: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuSectionID: number;

  @IsNotEmpty()
  @Type(() => CreateItemSizeDto)
  public baseItemSize: CreateItemSizeDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @isBaseItemSizeIncluded('baseItemSize', {
    message: 'baseItemSize object not in allItemSizes array.',
  })
  @Validate(isItemSizeUnique, {
    message: 'Item size labels must be unique.',
  })
  @Type(() => CreateItemSizeDto)
  public allItemSizes: CreateItemSizeDto[];

  @IsNotEmpty()
  @IsEnum(drinkItemCategoryOperator, {
    message: "category must be 'drink'",
  })
  public category: drinkItemCategory;

  @IsOptional()
  @IsInt()
  @Min(0)
  public calories?: number;

  @IsOptional()
  @IsBoolean()
  public isFeatured?: boolean;
}

export class EditDrinkItemDto implements EditMenuItemRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuItemID: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  public menuSectionID?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  public name?: string;

  @IsOptional()
  @IsString()
  public description?: string;

  @ValidateIf(o => o.baseItemSize !== undefined)
  @IsNotEmpty()
  @Type(() => CreateItemSizeDto)
  public baseItemSize?: CreateItemSizeDto;

  @ValidateIf(o => o.baseItemSize !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @isBaseItemSizeIncluded('baseItemSize', {
    message: 'baseItemSize object not in allItemSizes array.',
  })
  @Validate(isItemSizeUnique, {
    message: 'Item size labels must be unique.',
  })
  @Type(() => CreateItemSizeDto)
  public allItemSizes?: CreateItemSizeDto[];

  @IsOptional()
  @IsEnum(drinkItemCategoryOperator, {
    message: "category must be 'drink'",
  })
  public category?: drinkItemCategory;

  @ValidateIf(o => o.calories != null)
  @IsInt()
  @Min(0)
  @IsOptional()
  public calories?: number;

  @IsOptional()
  @IsBoolean()
  public isFeatured?: boolean;
}

export class DeleteDrinkItemDto implements DeleteMenuItemRequestInterface {
  @IsNumberString()
  @IsNotEmpty()
  public menuItemID: number;
}

export class HideDrinkItemsDto implements HideMenuItemRequestInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuItemID: number;

  @IsNotEmpty()
  @IsBoolean()
  public hide: boolean;
}
