import { CuisineEntity } from '@entities/cuisine.entity';

export interface BrandInterface {
  id?: string;
  restaurantGroupID: string;
  name: string;
  description?: string;
  website?: string;
  primaryTagline?: string;
  secondaryTagline?: string;
  reservationUrl?: string;
  orderingUrl?: string;
  cuisineID?: number;
  cuisine?: CuisineEntity;
  logoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
