import { IsBoolean } from 'class-validator';

export class UpdateOtterStorefrontAvailabilityDto {
  @IsBoolean()
  isAcceptingOrders: boolean;
}