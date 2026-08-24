import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { UpdateCareersSettingsRequestInterface } from '@interfaces/careersSettings.interface';

export class UpdateCareersSettingsDto implements UpdateCareersSettingsRequestInterface {
  @IsBoolean()
  public isCareersEnabled: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  public sectionTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  public careersText?: string;

  @IsOptional()
  @IsBoolean()
  public isInquiryFormEnabled?: boolean;

  // Allow null to explicitly clear the override (fall back to manager email).
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEmail()
  @MaxLength(254)
  public notificationEmail?: string | null;
}
