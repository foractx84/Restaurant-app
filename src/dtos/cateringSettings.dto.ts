import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { UpdateCateringSettingsRequestInterface } from '@interfaces/cateringSettings.interface';

export class UpdateCateringSettingsDto implements UpdateCateringSettingsRequestInterface {
  @IsBoolean()
  @IsNotEmpty()
  public isCateringEnabled: boolean;

  // Allow null to explicitly clear the override (fall back to manager email).
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEmail()
  @MaxLength(254)
  public cateringNotificationEmail?: string | null;
}
