import { IsIn, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
import {
  EVENT_REQUEST_STATUSES,
  EventRequestIdParamInterface,
  EventRequestStatus,
  ListEventRequestsQueryInterface,
  UpdateEventRequestStatusBodyInterface,
} from '@interfaces/eventRequests.interface';

export class ListEventRequestsQueryDto implements ListEventRequestsQueryInterface {
  @IsOptional()
  @IsIn(EVENT_REQUEST_STATUSES)
  public status?: EventRequestStatus;
}

export class EventRequestIdParamDto implements EventRequestIdParamInterface {
  @IsNumberString()
  @IsNotEmpty()
  public eventRequestID: number;
}

export class UpdateEventRequestStatusBodyDto implements UpdateEventRequestStatusBodyInterface {
  @IsIn(EVENT_REQUEST_STATUSES)
  @IsNotEmpty()
  public status: EventRequestStatus;
}
