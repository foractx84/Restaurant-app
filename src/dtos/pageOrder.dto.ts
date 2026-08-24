import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';
import { ORDERABLE_PAGE_KEYS, UpdatePageOrderRequestInterface } from '@interfaces/pageOrder.interface';

export class UpdatePageOrderDto implements UpdatePageOrderRequestInterface {
  // The full ordered list of page keys. Only known page keys are accepted; unknown keys are
  // rejected so a typo can't silently persist an un-renderable nav entry.
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(ORDERABLE_PAGE_KEYS as unknown as string[], { each: true })
  public order: string[];
}
