import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumberString, Min, ValidateNested } from 'class-validator';
import { EventMediaIdParamInterface, ReorderEventMediaBodyInterface, ReorderEventMediaItemInterface } from '@interfaces/eventMedia.interface';
import { EVENT_MEDIA } from '@/configs/config';

const MAX_REORDER_ITEMS = EVENT_MEDIA.MAX_EVENT_IMAGES + EVENT_MEDIA.MAX_EVENT_VIDEOS;

export class EventMediaIdParamDto implements EventMediaIdParamInterface {
  @IsNumberString()
  @IsNotEmpty()
  public eventMediaID: number;
}

export class ReorderEventMediaItemDto implements ReorderEventMediaItemInterface {
  @IsInt()
  @Min(1)
  public eventMediaID: number;

  @IsInt()
  @Min(0)
  public listOrder: number;
}

export class ReorderEventMediaBodyDto implements ReorderEventMediaBodyInterface {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_REORDER_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ReorderEventMediaItemDto)
  public items: ReorderEventMediaItemDto[];
}
