import {
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
  ValidateNested,
  ArrayNotEmpty,
  IsInt,
  IsPositive,
  IsNumberString,
  ArrayUnique,
  IsOptional,
  ArrayMaxSize,
  IsBoolean,
  MinLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateMenuItemRequestInterface,
  CreateMenuItemRestrictionsRequestInterface,
  DeleteMenuItemRequestInterface,
  EditMenuItemRequestInterface,
  HideMenuItemRequestInterface,
  LinkMenuItemAndModifierGroupsRequestInterface,
  PairMenuItemRequestInterface,
  ReorderMenuItemsRequestInterface,
  TagMenuItemsRequestInterface,
} from '@interfaces/menuItem.interface';
import { CreateItemSizeDto } from '@dtos/itemSize.dto';
import { CustomCategoryValidation } from '@validation/categoryValidation';
import { isBaseItemSizeIncluded } from '@validation/isBaseItemSizeIncluded';
import { isItemSizeUnique } from '@validation/isItemSizeUnique';
import { LinkMenuItemAndMediaAndThumbnailsInterface, LinkMenuItemAndMediaInterface } from '@interfaces/menuItemMedia.interface';
import { IsUniqueVideoID } from '@validation/isUniqueVideoID';

export class CreateMenuItemDto implements CreateMenuItemRequestInterface {
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

  @IsString()
  @IsNotEmpty()
  @Validate(CustomCategoryValidation, {
    message: 'Provided category must be "food" or "drink"',
  })
  public category: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  public calories?: number;

  @IsOptional()
  @IsBoolean()
  public isFeatured?: boolean;
}

export class EditMenuItemDto implements EditMenuItemRequestInterface {
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
  @IsString()
  @Validate(CustomCategoryValidation, {
    message: 'Provided category must be "food" or "drink"',
  })
  public category?: string;

  @ValidateIf(o => o.calories != null)
  @IsInt()
  @Min(0)
  @IsOptional()
  public calories?: number;

  @IsOptional()
  @IsBoolean()
  public isFeatured?: boolean;
}

export class CreateMenuItemDietaryRestrictions implements CreateMenuItemRestrictionsRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuItemID: number;
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  public dietaryRestrictionIDs: number[];
}

export class LinkMenuItemAndModifierGroups implements LinkMenuItemAndModifierGroupsRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuItemID: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  public modifierGroupIDs: number[];
}

export class DeleteMenuItemDto implements DeleteMenuItemRequestInterface {
  @IsNumberString()
  @IsNotEmpty()
  public menuItemID: number;
}

export class HideMenuItemsDto implements HideMenuItemRequestInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuItemID: number;

  @IsNotEmpty()
  @IsBoolean()
  public hide: boolean;
}

export class PairMenuItemsDto implements PairMenuItemRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public menuItemID: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  public pairingItemIDs: number[];
}

export class ReorderMenuItemsDto implements ReorderMenuItemsRequestInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuSectionID: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayUnique()
  public menuItemsOrder: number[];
}

export class TagMenuItemsDto implements TagMenuItemsRequestInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuItemID: number;

  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(1) // for now, 1 tag, but keep unique in case of more in future
  public tagIDs: number[];
}

export class LinkMenuItemAndMediaDto implements LinkMenuItemAndMediaInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public menuItemID: number;

  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  public mediaIDs: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkMenuItemAndMediaAndThumbnailsDto)
  @IsUniqueVideoID({
    message: 'Each videoID must be unique.',
  })
  public thumbnails: LinkMenuItemAndMediaAndThumbnailsDto[];
}

export class LinkMenuItemAndMediaAndThumbnailsDto implements LinkMenuItemAndMediaAndThumbnailsInterface {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public videoID: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  public thumbnailID: number;
}
