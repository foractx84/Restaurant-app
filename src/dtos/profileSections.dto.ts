import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
  ValidationArguments,
} from 'class-validator';
import { hasDependency } from '@validation/hasDependency';
import { SectionTemplates } from '@enums/sectionTemplates';

export class CreateProfileSectionDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsOptional()
  @IsString()
  public title?: string;

  @IsString()
  @ValidateIf(o => o.template === SectionTemplates.COPY)
  @IsNotEmpty({
    message: (args: ValidationArguments) =>
      `Content is required when creating template of type: ${(args.object as CreateProfileSectionDto).template}.`,
  })
  public content?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(SectionTemplates), {
    message: `Template must one of allowed values: ${Object.values(SectionTemplates).toString()}`,
  })
  public template: string;

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
  public subNav?: string;

  @IsOptional()
  @IsBoolean()
  public isHidden?: boolean;
}

export class CreateSingleProfileSectionDto extends CreateProfileSectionDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public pageID: number;
}

export class EditProfileSectionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  public sectionID: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  public name?: string;

  @IsOptional()
  @IsString()
  public title?: string;

  @IsOptional()
  @IsString()
  @ValidateIf(o => o.template === SectionTemplates.COPY)
  @MinLength(1)
  public content?: string;

  @IsString()
  @IsNotEmpty({
    message: () => `Template is required.`,
  })
  @IsIn(Object.values(SectionTemplates), {
    message: `Template must one of allowed values: ${Object.values(SectionTemplates).toString()}`,
  })
  public template: string;

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
  public subNav?: string;

  @IsOptional()
  @IsBoolean()
  public isHidden?: boolean;
}

export class DeleteProfileSectionDto {
  @IsNumberString()
  public sectionID: number;
}

export class LinkRestaurantProfileSectionMediaDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public sectionID: number;

  @IsArray()
  @ArrayMaxSize(15)
  @IsInt({ each: true })
  @ArrayUnique()
  public mediaIDs?: number[];
}

export class CreateProfileSectionCardsDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public sectionID: number;

  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  public content: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  public subtitle: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  linkURL: string;
}

export class DeleteProfileSectionCardDto {
  @IsNumberString()
  public cardID: number;
}

export class EditProfileSectionCardsDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public cardID: number;

  @IsOptional()
  @MinLength(1)
  @IsString()
  public title: string;

  @IsOptional()
  @IsString()
  public content: string;

  @IsOptional()
  @IsString()
  public subtitle: string;

  @IsOptional()
  @IsString()
  linkURL: string;
}
