import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import {
  RestaurantColorSettingsInterface,
  RestaurantColorSlotInterface,
  RestaurantFontSettingsInterface,
  RestaurantFontSlotInterface,
} from '@/interfaces/restaurantTypography.interface';

export class RestaurantFontSlotDto implements RestaurantFontSlotInterface {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  public fontFamily: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Invalid hex color format' })
  public color: string;
}

/** Body for PUT /restaurant/design/fonts — all seven typography slots (Figma Design → Fonts). */
export class UpdateRestaurantFontSettingsDto implements RestaurantFontSettingsInterface {
  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public navigation: RestaurantFontSlotDto;

  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public body: RestaurantFontSlotDto;

  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public pageHeaders: RestaurantFontSlotDto;

  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public subheaders: RestaurantFontSlotDto;

  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public menus: RestaurantFontSlotDto;

  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public menuSections: RestaurantFontSlotDto;

  @ValidateNested()
  @Type(() => RestaurantFontSlotDto)
  public menuItems: RestaurantFontSlotDto;
}

export class RestaurantColorSlotDto implements RestaurantColorSlotInterface {
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Invalid hex color format' })
  public color: string;
}

/** Body for PUT /restaurant/design/colors — site background and accent colors (Figma Design → Colors). */
export class UpdateRestaurantColorSettingsDto implements RestaurantColorSettingsInterface {
  @ValidateNested()
  @Type(() => RestaurantColorSlotDto)
  public navigationBackground: RestaurantColorSlotDto;

  @ValidateNested()
  @Type(() => RestaurantColorSlotDto)
  public websiteBackground: RestaurantColorSlotDto;

  @ValidateNested()
  @Type(() => RestaurantColorSlotDto)
  public onlineOrderingBackground: RestaurantColorSlotDto;

  @ValidateNested()
  @Type(() => RestaurantColorSlotDto)
  public onlineOrderingActiveSelections: RestaurantColorSlotDto;
}
