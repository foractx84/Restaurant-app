import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  CreateAnnouncementRequestInterface,
  DeleteAnnouncementsInterface,
  EditAnnouncementRequestInterface,
  HideAnnouncementRequestInterface,
  LinkAnnouncementToMediaRequestInterface,
} from '@interfaces/announcements.interface';
import { isValidTimeSpan } from '@validation/isValidTimeSpan';
import { AnnouncementType } from '@enums/announcementType';
import { validateAnnouncementType, validateEditAnnouncementType } from '@validation/validateAnnouncementType';

export class CreateAnnouncementDto implements CreateAnnouncementRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  public name: string;

  @IsString()
  @MaxLength(70)
  @IsOptional()
  public title: string;

  @IsString()
  @IsOptional()
  public description: string;

  @IsDateString()
  @MinLength(1)
  @IsNotEmpty()
  public startDate: string;

  @IsDateString()
  @isValidTimeSpan('startDate', {
    message: 'Start date must be before end date.',
  })
  @IsNotEmpty()
  public endDate: string;

  @IsString()
  @IsNotEmpty()
  @validateAnnouncementType('title, description', {
    message: 'Provided announcement type must be "modal", "drawer", or "embed", "title" and "description" are required for type "modal" or "drawer"',
  })
  public type: AnnouncementType;

  @ValidateIf(o => (o.type === AnnouncementType.DRAWER || o.type === AnnouncementType.MODAL) && o.submitEmail !== undefined)
  @IsOptional()
  @IsBoolean()
  public submitEmail?: boolean;
}

export class DeleteAnnouncementsDto implements DeleteAnnouncementsInterface {
  @IsNumberString()
  @IsNotEmpty()
  public announcementID: number;
}

export class EditAnnouncementDto implements EditAnnouncementRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public announcementID: number;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(70)
  @IsOptional()
  public title: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  public description: string;

  @IsDateString()
  @MinLength(1)
  @IsNotEmpty()
  public startDate: string;

  @IsDateString()
  @isValidTimeSpan('startDate', {
    message: 'Start date must be before end date.',
  })
  @IsNotEmpty()
  public endDate: string;

  @IsOptional()
  @IsBoolean()
  public submitEmail?: boolean;

  @IsString()
  @IsOptional()
  @validateEditAnnouncementType('type', {
    message: 'Provided announcement type must be "modal", "drawer", or "embed"',
  })
  public type: AnnouncementType;
}

export class HideAnnouncementDto implements HideAnnouncementRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public announcementID: number;

  @IsBoolean()
  @IsNotEmpty()
  public hide: boolean;
}

export class LinkAnnouncementToMediaDto implements LinkAnnouncementToMediaRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public announcementID: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  public mediaIDs: number[];
}
