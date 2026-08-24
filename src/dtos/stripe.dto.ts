import {
  CreateStripeCheckoutSessionRequestInterface,
  GetStripeCheckoutSessionRequest,
  StripeCheckoutSessionRequestPackagesInterface,
} from '@interfaces/stripe.interface';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsPositive, IsString, MinLength, ValidateNested } from 'class-validator';

export class StripeCheckoutSessionRequestPackagesDto implements StripeCheckoutSessionRequestPackagesInterface {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  priceID: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;
}

export class CreateStripeCheckoutSessionDto implements CreateStripeCheckoutSessionRequestInterface {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StripeCheckoutSessionRequestPackagesDto)
  packages: StripeCheckoutSessionRequestPackagesDto[];
}

export class GetStripeCheckoutSessionDto implements GetStripeCheckoutSessionRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  session: string;
}
