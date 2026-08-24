import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
  ValidationArguments,
} from 'class-validator';
import { CreateProfileSectionDto } from '@dtos/profileSections.dto';
import { hasDependency } from '@validation/hasDependency';
import { Type } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

export class CreateProfilePageRequestBodyDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsOptional()
  @IsString()
  /*
   * Validate urlPath is written in kebab case. Ex: 'example-1'
   */
  @Matches(/^(|[a-z0-9]+(-[a-z0-9]+)*)$/, {
    message: (args: ValidationArguments) => `The ${args.property} must be written in kebab case. Ex: 'example-path'`,
  })
  public urlPath?: string;

  @IsOptional()
  @IsString()
  @hasDependency('urlPath')
  public navLink?: string;

  @IsBoolean()
  @IsNotEmpty()
  public isHidden: boolean;

  @IsOptional()
  @IsNotEmpty()
  public seoTitle: string;

  @IsOptional()
  @IsString()
  public seoDescription?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique((section: CreateProfileSectionDto) => section?.name?.trim()?.toLowerCase(), {
    message: 'Duplicate section names detected. Please ensure each section has a unique name value and try again.',
  })
  @ArrayUnique((section: CreateProfileSectionDto) => (section?.urlPath ? section?.urlPath?.trim()?.toLowerCase() : uuidv4()), {
    message: 'Duplicate url path detected. Please ensure each section has a unique url path value, if required, and try again.',
  })
  @ArrayUnique((section: CreateProfileSectionDto) => section?.subNav?.trim()?.toLowerCase() ?? uuidv4(), {
    message: 'Duplicate sub navigation detected. Please ensure each section has a unique sub navigation value, if required, and try again.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateProfileSectionDto)
  public profileSections?: CreateProfileSectionDto[];
}

export class EditProfilePageRequestBodyDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public pageID: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  public name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(|[a-z0-9]+(-[a-z0-9]+)*)$/, {
    message: (args: ValidationArguments) => `The ${args.property} must be written in kebab case. Ex: 'example-path'`,
  })
  public urlPath?: string;

  @IsOptional()
  @IsString()
  public navLink?: string;

  @IsOptional()
  @IsBoolean()
  public isHidden?: boolean;

  @IsOptional()
  @IsString()
  public seoTitle?: string;

  @IsOptional()
  @IsString()
  public seoDescription?: string;
}

export class GetProfilePageRequestBodyDto {
  @IsNumberString()
  public pageID: number;
}
