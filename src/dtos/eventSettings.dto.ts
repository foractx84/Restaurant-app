import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { UpdateEventSettingsRequestInterface } from '@interfaces/eventSettings.interface';

export class UpdateEventSettingsDto implements UpdateEventSettingsRequestInterface {
  @IsBoolean()
  public isEventsEnabled: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  public sectionTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  public eventsText?: string;

  // Allow null to explicitly clear the deck URL.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl()
  @MaxLength(2048)
  public deckUrl?: string | null;

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
