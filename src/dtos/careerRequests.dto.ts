import { IsIn, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
import {
  CAREER_REQUEST_STATUSES,
  CareerRequestIdParamInterface,
  CareerRequestStatus,
  ListCareerRequestsQueryInterface,
  UpdateCareerRequestStatusBodyInterface,
} from '@interfaces/careerRequests.interface';

export class ListCareerRequestsQueryDto implements ListCareerRequestsQueryInterface {
  @IsOptional()
  @IsIn(CAREER_REQUEST_STATUSES)
  public status?: CareerRequestStatus;
}

export class CareerRequestIdParamDto implements CareerRequestIdParamInterface {
  @IsNumberString()
  @IsNotEmpty()
  public careerRequestID: number;
}

export class UpdateCareerRequestStatusBodyDto implements UpdateCareerRequestStatusBodyInterface {
  @IsIn(CAREER_REQUEST_STATUSES)
  @IsNotEmpty()
  public status: CareerRequestStatus;
}
