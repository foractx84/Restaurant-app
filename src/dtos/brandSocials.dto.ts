import { IsOptional, IsString } from 'class-validator';

export class BrandSocialsDto {
  @IsString()
  @IsOptional()
  public facebook?: string;

  @IsString()
  @IsOptional()
  public instagram?: string;

  @IsString()
  @IsOptional()
  public tiktok?: string;

  @IsString()
  @IsOptional()
  public snapchat?: string;

  @IsString()
  @IsOptional()
  public twitter?: string;
}
