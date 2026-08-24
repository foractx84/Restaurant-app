import {
  CreateModifierGroupRequestInterface,
  DeleteModifierGroupRequestInterface,
  EditModifierGroupRequestInterface,
  LinkModifiersToModifierGroupRequestInterface,
} from '@interfaces/modifierGroup.interface';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { isValidSelectionRange } from '@validation/isValidSelectionRange';

export class CreateModifierGroupDto implements CreateModifierGroupRequestInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  label: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayUnique()
  modifierIDs: number[];

  @IsInt()
  @Min(0)
  @IsOptional()
  minimumSelections?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Validate(isValidSelectionRange)
  maximumSelections?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxPerModifierSelectionQuantity?: number | null;
}

export class DeleteModifierGroupDto implements DeleteModifierGroupRequestInterface {
  @IsNumberString()
  @IsNotEmpty()
  modifierGroupID: number;
}

export class EditModifierGroupDto implements EditModifierGroupRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  modifierGroupID: number;

  @IsString()
  @MinLength(1)
  @IsOptional()
  name: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  label: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minimumSelections?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Validate(isValidSelectionRange)
  maximumSelections?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxPerModifierSelectionQuantity?: number | null;
}

export class LinkModifiersToModifierGroupDto implements LinkModifiersToModifierGroupRequestInterface {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  modifierGroupID: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ArrayUnique()
  modifierIDs: number[];
}
