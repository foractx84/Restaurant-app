import { IsInt, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class LinkMediaToProfileCardDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public cardID: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  public mediaID: number;
}
