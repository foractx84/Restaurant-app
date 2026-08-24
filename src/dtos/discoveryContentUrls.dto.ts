import { IsHttpsUrl } from '@/validation/isValidHttps';
import { PlatformENUMS, PlatformUrlTypeENUMS } from '../enums/discoveryURLPlatforms';
import { IsIn, IsString } from 'class-validator';

export class CreateDiscoveryContentUrlsDto {
  @IsString()
  @IsHttpsUrl({ message: 'URL must start with "https://" and include a valid domain like .com, .edu, .org, etc.' })
  url: string;

  @IsString()
  @IsIn(Object.values(PlatformENUMS))
  platform: PlatformENUMS;

  @IsString()
  @IsIn(Object.values(PlatformUrlTypeENUMS))
  type: PlatformUrlTypeENUMS;
}
