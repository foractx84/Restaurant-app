import { CreateTagRequestInterface } from '@interfaces/tags.interface';
import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateTagDto implements CreateTagRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Invalid hex color format' })
  public color: string;
}
