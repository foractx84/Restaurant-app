import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DeleteDiscoveryContentRequestInterface, HideDiscoveryContentRequest } from '@interfaces/discoveryContent.interface';
import { Type } from 'class-transformer';
import { CreateDiscoveryContentUrlsDto } from './discoveryContentUrls.dto';
import { DiscoveryCategoriesENUMS } from '@/enums/discoveryCategories';

export class HideDiscoveryContentDto implements HideDiscoveryContentRequest {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  discoveryContentID: number;

  @IsNotEmpty()
  @IsBoolean()
  public hide: boolean;
}

export class DeleteDiscoveryContentDto implements DeleteDiscoveryContentRequestInterface {
  @IsNumberString()
  @IsNotEmpty()
  discoveryContentID: number;
}

export class CreateDiscoveryContentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayMaxSize(5)
  mediaIDs: number[]; // required, at least one 1

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiscoveryContentUrlsDto)
  urls: CreateDiscoveryContentUrlsDto[];

  // hashtags to tag a discovery content a discovery item and increase visilibity
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaTags?: string[];

  // currently hardcoded values in databaase that user chooses from drop down menu in order to organize and filter their discovery conten
  // the current categories are:
  // 1. dish_media
  // 2. dish_story
  // 3. promotions
  // 4. spaces
  // 5. chef_story
  // 6. vibes
  // 7.  misc
  @IsOptional()
  @IsEnum(DiscoveryCategoriesENUMS, {
    each: true,
    message: 'Each category must be either dish_media, dish_story, promotions, spaces, chef_story, vibes, misc',
  })
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class EditDiscoveryContentDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  discoveryContentID: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayMaxSize(5)
  mediaIDs?: [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiscoveryContentUrlsDto)
  urls?: CreateDiscoveryContentUrlsDto[];

  // hashtags to tag a discovery content a discovery item and increase visilibity
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaTags?: string[];

  // currently hardcoded values in databaase that user chooses from drop down menu in order to organize and filter their discovery conten
  // the current categories are:
  // 1. dish_media
  // 2. dish_story
  // 3. promotions
  // 4. spaces
  // 5. chef_story
  // 6. vibes
  // 7.  misc
  @IsOptional()
  @IsEnum(DiscoveryCategoriesENUMS, {
    each: true,
    message: 'Each category must be either dish_media, dish_story, promotions, spaces, chef_story, vibes, misc',
  })
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
