import { RestaurantSocialsRequestInterface } from '@interfaces/restaurantSocials.interface';
import { IsOptional, IsString } from 'class-validator';

export class CreateRestaurantSocialsRequestDto implements RestaurantSocialsRequestInterface {
  @IsString()
  @IsOptional()
  public facebook: string;

  @IsString()
  @IsOptional()
  public instagram: string;

  @IsString()
  @IsOptional()
  public tiktok: string;

  @IsString()
  @IsOptional()
  public twitter: string;

  @IsString()
  @IsOptional()
  public snapchat: string;
}
