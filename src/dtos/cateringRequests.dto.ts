import { IsIn, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
import {
  CATERING_REQUEST_STATUSES,
  CateringRequestIdParamInterface,
  CateringRequestStatus,
  ListCateringRequestsQueryInterface,
  UpdateCateringRequestStatusBodyInterface,
} from '@interfaces/cateringRequests.interface';

export class ListCateringRequestsQueryDto implements ListCateringRequestsQueryInterface {
  @IsOptional()
  @IsIn(CATERING_REQUEST_STATUSES)
  public status?: CateringRequestStatus;
}

export class CateringRequestIdParamDto implements CateringRequestIdParamInterface {
  @IsNumberString()
  @IsNotEmpty()
  public cateringRequestID: number;
}

export class UpdateCateringRequestStatusBodyDto implements UpdateCateringRequestStatusBodyInterface {
  @IsIn(CATERING_REQUEST_STATUSES)
  @IsNotEmpty()
  public status: CateringRequestStatus;
}
