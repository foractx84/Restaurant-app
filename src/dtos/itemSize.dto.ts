import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { ItemSize } from '@interfaces/itemSize.interface';

export class CreateItemSizeDto implements ItemSize {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public label: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public price: number;

  @IsString()
  @IsOptional()
  public priceOverride: string;
}
